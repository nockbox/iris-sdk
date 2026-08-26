import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

import {
  WITHDRAWAL_POLICY_V1,
  WITHDRAWAL_WIRE_V1,
  WithdrawalWireError,
  decodeWithdrawalWireV1,
  encodeWithdrawalWireV1,
  resolveWithdrawalDestinationV1,
  validateWithdrawalPolicyV1Amount,
  validateWithdrawalWireV1,
  type WithdrawalDestinationV1,
  type WithdrawalWireErrorCode,
} from '../src/withdrawal.js';
import { initWasm } from '../src/wasm.js';

export const WITHDRAWAL_E2E_REQUEST_PROTOCOL = 'iris-withdrawal-e2e-request-v1' as const;
export const WITHDRAWAL_E2E_RESULT_PROTOCOL = 'iris-withdrawal-e2e-result-v1' as const;

export interface WithdrawalE2eSdkMetadata {
  package_name: string;
  package_version: string;
  revision: string;
}

export interface WithdrawalE2eRequest {
  protocol: typeof WITHDRAWAL_E2E_REQUEST_PROTOCOL;
  sdk_metadata: WithdrawalE2eSdkMetadata;
  nock_token_address: string;
  burner_address: string;
  amount_base_units: string;
  destination: WithdrawalDestinationV1;
  expected: {
    wire_protocol: string;
    withdrawal_policy: string;
    nock_token_address: string;
    burner_address: string;
  };
}

export interface WithdrawalE2eSuccess {
  protocol: typeof WITHDRAWAL_E2E_RESULT_PROTOCOL;
  ok: true;
  sdk_metadata: WithdrawalE2eSdkMetadata;
  wire_protocol: string;
  withdrawal_policy: string;
  selector: string;
  destination: {
    kind: WithdrawalDestinationV1['kind'];
    normalized: string;
    lock_root: string;
    lock_root_limbs: [string, string, string, string, string];
  };
  amount: {
    base_units: string;
    nicks: string;
    bridge_fee_nicks: string;
    net_after_bridge_fee_nicks: string;
  };
  commitment: string;
  calldata: string;
  calldata_byte_length: number;
  self_validation: {
    valid: true;
    decoded_wire_protocol: string;
    decoded_amount_base_units: string;
    decoded_commitment: string;
    decoded_lock_root_limbs: [string, string, string, string, string];
  };
}

export type WithdrawalE2eDriverErrorCode =
  | WithdrawalWireErrorCode
  | 'invalid_json'
  | 'invalid_request'
  | 'unsupported_protocol'
  | 'wire_protocol_mismatch'
  | 'withdrawal_policy_mismatch'
  | 'internal_error';

export interface WithdrawalE2eFailure {
  protocol: typeof WITHDRAWAL_E2E_RESULT_PROTOCOL;
  ok: false;
  error: {
    code: WithdrawalE2eDriverErrorCode;
    message: string;
  };
}

export type WithdrawalE2eResponse = WithdrawalE2eSuccess | WithdrawalE2eFailure;

export class WithdrawalE2eDriverError extends Error {
  readonly code: Exclude<WithdrawalE2eDriverErrorCode, WithdrawalWireErrorCode | 'internal_error'>;

  constructor(
    code: Exclude<WithdrawalE2eDriverErrorCode, WithdrawalWireErrorCode | 'internal_error'>,
    message: string
  ) {
    super(message);
    this.name = 'WithdrawalE2eDriverError';
    this.code = code;
    Object.setPrototypeOf(this, WithdrawalE2eDriverError.prototype);
  }
}

export function parseWithdrawalE2eRequest(value: unknown): WithdrawalE2eRequest {
  const request = requireRecord(value, 'request');
  requireExactKeys(
    request,
    [
      'protocol',
      'sdk_metadata',
      'nock_token_address',
      'burner_address',
      'amount_base_units',
      'destination',
      'expected',
    ],
    'request'
  );
  if (request.protocol !== WITHDRAWAL_E2E_REQUEST_PROTOCOL) {
    throw new WithdrawalE2eDriverError(
      'unsupported_protocol',
      `protocol must be ${WITHDRAWAL_E2E_REQUEST_PROTOCOL}`
    );
  }
  if (typeof request.amount_base_units !== 'string') {
    throw new WithdrawalWireError(
      'invalid_amount_type',
      'amount_base_units must be an exact decimal string'
    );
  }
  if (!/^(0|[1-9][0-9]*)$/.test(request.amount_base_units)) {
    throw new WithdrawalE2eDriverError(
      'invalid_request',
      'amount_base_units must be an unsigned canonical decimal string'
    );
  }

  const sdkMetadata = parseSdkMetadata(request.sdk_metadata);
  const destination = requireRecord(request.destination, 'destination');
  requireExactKeys(destination, ['kind', 'value'], 'destination');
  if (destination.kind !== 'v1_pkh' && destination.kind !== 'lock_root') {
    throw new WithdrawalE2eDriverError(
      'invalid_request',
      'destination.kind must be v1_pkh or lock_root'
    );
  }
  const expected = requireRecord(request.expected, 'expected');
  requireExactKeys(
    expected,
    ['wire_protocol', 'withdrawal_policy', 'nock_token_address', 'burner_address'],
    'expected'
  );

  return {
    protocol: WITHDRAWAL_E2E_REQUEST_PROTOCOL,
    sdk_metadata: sdkMetadata,
    nock_token_address: requireString(request.nock_token_address, 'nock_token_address'),
    burner_address: requireString(request.burner_address, 'burner_address'),
    amount_base_units: request.amount_base_units,
    destination: {
      kind: destination.kind,
      value: requireString(destination.value, 'destination.value'),
    },
    expected: {
      wire_protocol: requireString(expected.wire_protocol, 'expected.wire_protocol'),
      withdrawal_policy: requireString(expected.withdrawal_policy, 'expected.withdrawal_policy'),
      nock_token_address: requireString(expected.nock_token_address, 'expected.nock_token_address'),
      burner_address: requireString(expected.burner_address, 'expected.burner_address'),
    },
  };
}

export async function encodeWithdrawalE2e(
  request: WithdrawalE2eRequest
): Promise<WithdrawalE2eSuccess> {
  if (request.expected.wire_protocol !== WITHDRAWAL_WIRE_V1.protocol) {
    throw new WithdrawalE2eDriverError(
      'wire_protocol_mismatch',
      `expected.wire_protocol must be ${WITHDRAWAL_WIRE_V1.protocol}`
    );
  }
  if (request.expected.withdrawal_policy !== WITHDRAWAL_POLICY_V1.policy) {
    throw new WithdrawalE2eDriverError(
      'withdrawal_policy_mismatch',
      `expected.withdrawal_policy must be ${WITHDRAWAL_POLICY_V1.policy}`
    );
  }

  if (request.destination.kind === 'v1_pkh') {
    await initializeNodeWasmWithoutStdout();
  }
  const resolved = await withoutStdoutContamination(() =>
    resolveWithdrawalDestinationV1(request.destination)
  );
  const amountBaseUnits = BigInt(request.amount_base_units);
  const policy = validateWithdrawalPolicyV1Amount(amountBaseUnits);
  const input = {
    nockTokenAddress: request.nock_token_address,
    burnerAddress: request.burner_address,
    amountBaseUnits,
    lockRootLimbs: resolved.lockRootLimbs,
  };
  const encoded = encodeWithdrawalWireV1(input);
  const decoded = decodeWithdrawalWireV1(encoded.calldata);
  const validated = validateWithdrawalWireV1(encoded.calldata, {
    ...input,
    nockTokenAddress: request.expected.nock_token_address,
    burnerAddress: request.expected.burner_address,
  });
  if (decoded.calldata !== validated.calldata || decoded.commitment !== validated.commitment) {
    throw new WithdrawalE2eDriverError(
      'invalid_request',
      'decode and self-validation results disagree'
    );
  }

  return {
    protocol: WITHDRAWAL_E2E_RESULT_PROTOCOL,
    ok: true,
    sdk_metadata: request.sdk_metadata,
    wire_protocol: WITHDRAWAL_WIRE_V1.protocol,
    withdrawal_policy: WITHDRAWAL_POLICY_V1.policy,
    selector: encoded.selector,
    destination: {
      kind: resolved.kind,
      normalized: resolved.normalizedDestination,
      lock_root: resolved.lockRoot,
      lock_root_limbs: stringifyLimbs(resolved.lockRootLimbs),
    },
    amount: {
      base_units: amountBaseUnits.toString(),
      nicks: policy.amountNicks.toString(),
      bridge_fee_nicks: policy.bridgeFeeNicks.toString(),
      net_after_bridge_fee_nicks: policy.amountAfterBridgeFeeNicks.toString(),
    },
    commitment: encoded.commitment,
    calldata: encoded.calldata,
    calldata_byte_length: (encoded.calldata.length - 2) / 2,
    self_validation: {
      valid: true,
      decoded_wire_protocol: validated.protocol,
      decoded_amount_base_units: validated.amountBaseUnits.toString(),
      decoded_commitment: validated.commitment,
      decoded_lock_root_limbs: stringifyLimbs(validated.lockRootLimbs),
    },
  };
}

export async function runWithdrawalE2eJson(input: string): Promise<WithdrawalE2eResponse> {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new WithdrawalE2eDriverError(
        'invalid_json',
        'stdin must contain one valid JSON object'
      );
    }
    return await encodeWithdrawalE2e(parseWithdrawalE2eRequest(parsed));
  } catch (error) {
    return failureResponse(error);
  }
}

async function initializeNodeWasmWithoutStdout(): Promise<void> {
  let wasmBytes: Buffer;
  try {
    wasmBytes = await readFile(new URL('./iris_wasm_bg.wasm', import.meta.url));
  } catch (error) {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error) ||
      error.code !== 'ENOENT'
    ) {
      throw error;
    }
    const dependencyUrl = import.meta.resolve('@nockbox/iris-wasm/iris_wasm_bg.wasm');
    wasmBytes = await readFile(new URL(dependencyUrl));
  }
  await withoutStdoutContamination(() => initWasm({ module_or_path: wasmBytes }));
}

async function withoutStdoutContamination<T>(action: () => Promise<T>): Promise<T> {
  const originalLog = console.log;
  const originalInfo = console.info;
  console.log = (...values: unknown[]) => console.error(...values);
  console.info = (...values: unknown[]) => console.error(...values);
  try {
    return await action();
  } finally {
    console.log = originalLog;
    console.info = originalInfo;
  }
}

function parseSdkMetadata(value: unknown): WithdrawalE2eSdkMetadata {
  const metadata = requireRecord(value, 'sdk_metadata');
  requireExactKeys(metadata, ['package_name', 'package_version', 'revision'], 'sdk_metadata');
  const packageName = requireString(metadata.package_name, 'sdk_metadata.package_name');
  const packageVersion = requireString(metadata.package_version, 'sdk_metadata.package_version');
  const revision = requireString(metadata.revision, 'sdk_metadata.revision');
  if (packageName !== '@nockbox/iris-sdk' || !/^[0-9a-f]{40}$/.test(revision)) {
    throw new WithdrawalE2eDriverError(
      'invalid_request',
      'sdk_metadata must identify @nockbox/iris-sdk at a full lowercase git revision'
    );
  }
  return {
    package_name: packageName,
    package_version: packageVersion,
    revision,
  };
}

function failureResponse(error: unknown): WithdrawalE2eFailure {
  if (error instanceof WithdrawalWireError || error instanceof WithdrawalE2eDriverError) {
    return {
      protocol: WITHDRAWAL_E2E_RESULT_PROTOCOL,
      ok: false,
      error: { code: error.code, message: error.message },
    };
  }
  return {
    protocol: WITHDRAWAL_E2E_RESULT_PROTOCOL,
    ok: false,
    error: { code: 'internal_error', message: 'withdrawal driver failed unexpectedly' },
  };
}

function requireRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new WithdrawalE2eDriverError('invalid_request', `${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  field: string
): void {
  const unknown = Object.keys(value).filter(key => !expected.includes(key));
  const missing = expected.filter(key => !(key in value));
  if (unknown.length > 0 || missing.length > 0) {
    throw new WithdrawalE2eDriverError(
      'invalid_request',
      `${field} keys are invalid (unknown=${unknown.sort().join(',') || 'none'}; missing=${missing.join(',') || 'none'})`
    );
  }
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new WithdrawalE2eDriverError('invalid_request', `${field} must be a non-empty string`);
  }
  return value;
}

function stringifyLimbs(limbs: readonly bigint[]): [string, string, string, string, string] {
  if (limbs.length !== 5) {
    throw new WithdrawalE2eDriverError('invalid_request', 'lock root must contain five limbs');
  }
  return [
    limbs[0].toString(),
    limbs[1].toString(),
    limbs[2].toString(),
    limbs[3].toString(),
    limbs[4].toString(),
  ];
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function runWithdrawalE2eCli(): Promise<number> {
  const response = await runWithdrawalE2eJson(await readStdin());
  process.stdout.write(`${JSON.stringify(response)}\n`);
  if (!response.ok) {
    process.stderr.write(`iris withdrawal E2E driver: ${response.error.code}\n`);
  }
  return response.ok ? 0 : 1;
}

const entrypoint = process.argv[1]
  ? pathToFileURL(realpathSync(resolve(process.argv[1]))).href
  : undefined;
if (entrypoint === import.meta.url) {
  runWithdrawalE2eCli()
    .then(exitCode => {
      process.exitCode = exitCode;
    })
    .catch(() => {
      const response: WithdrawalE2eFailure = {
        protocol: WITHDRAWAL_E2E_RESULT_PROTOCOL,
        ok: false,
        error: { code: 'internal_error', message: 'withdrawal driver failed unexpectedly' },
      };
      process.stdout.write(`${JSON.stringify(response)}\n`);
      process.stderr.write('iris withdrawal E2E driver: internal_error\n');
      process.exitCode = 1;
    });
}
