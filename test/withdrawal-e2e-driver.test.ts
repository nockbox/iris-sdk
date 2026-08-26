import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { base58 } from '@scure/base';

import {
  WITHDRAWAL_E2E_REQUEST_PROTOCOL,
  WITHDRAWAL_E2E_RESULT_PROTOCOL,
  encodeWithdrawalE2e,
  parseWithdrawalE2eRequest,
  runWithdrawalE2eJson,
  type WithdrawalE2eRequest,
} from '../scripts/encode-withdrawal-e2e.js';
import {
  WITHDRAWAL_POLICY_V1,
  WITHDRAWAL_WIRE_V1,
  type WithdrawalWireErrorCode,
} from '../src/withdrawal.js';

interface ValidFixture {
  nock_token_address: string;
  burner_address: string;
  amount_base_units: string;
  lock_root_limbs: [string, string, string, string, string];
  commitment: string;
  calldata: string;
}

interface WireFixture {
  valid_vectors: ValidFixture[];
}

const fixture = JSON.parse(
  readFileSync(new URL('../test-fixtures/withdrawal_wire_v1_vectors.json', import.meta.url), 'utf8')
) as WireFixture;
const canonical = fixture.valid_vectors[0];

function directRootRequest(): WithdrawalE2eRequest {
  return {
    protocol: WITHDRAWAL_E2E_REQUEST_PROTOCOL,
    sdk_metadata: {
      package_name: '@nockbox/iris-sdk',
      package_version: '0.3.0',
      revision: '0123456789abcdef0123456789abcdef01234567',
    },
    nock_token_address: canonical.nock_token_address,
    burner_address: canonical.burner_address,
    amount_base_units: canonical.amount_base_units,
    destination: {
      kind: 'lock_root',
      value: lockRootFromLimbs(canonical.lock_root_limbs),
    },
    expected: {
      wire_protocol: WITHDRAWAL_WIRE_V1.protocol,
      withdrawal_policy: WITHDRAWAL_POLICY_V1.policy,
      nock_token_address: canonical.nock_token_address,
      burner_address: canonical.burner_address,
    },
  };
}

function lockRootFromLimbs(limbs: readonly string[]): string {
  const bytes = new Uint8Array(40);
  const view = new DataView(bytes.buffer);
  for (let index = 0; index < limbs.length; index += 1) {
    view.setBigUint64(index * 8, BigInt(limbs[index]), false);
  }
  return base58.encode(bytes);
}

function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

async function expectDriverError(
  action: () => Promise<unknown>,
  code: WithdrawalWireErrorCode | string
): Promise<void> {
  await assert.rejects(action, (error: unknown) => hasErrorCode(error, code));
}

test('direct-root driver output matches the canonical Rust fixture exactly', async () => {
  const request = directRootRequest();
  const result = await encodeWithdrawalE2e(request);

  assert.equal(result.protocol, WITHDRAWAL_E2E_RESULT_PROTOCOL);
  assert.equal(result.calldata, canonical.calldata);
  assert.equal(result.commitment, canonical.commitment);
  assert.equal(result.calldata_byte_length, 116);
  assert.equal(result.destination.lock_root, request.destination.value);
  assert.deepEqual(result.destination.lock_root_limbs, canonical.lock_root_limbs);
  assert.equal(result.amount.base_units, canonical.amount_base_units);
  assert.equal(
    result.amount.nicks,
    (BigInt(canonical.amount_base_units) / WITHDRAWAL_POLICY_V1.baseUnitsPerNick).toString()
  );
  assert.equal(result.self_validation.valid, true);
  assert.equal(result.self_validation.decoded_amount_base_units, canonical.amount_base_units);
  assert.deepEqual(result.self_validation.decoded_lock_root_limbs, canonical.lock_root_limbs);

  for (const value of Object.values(result.amount)) {
    assert.equal(typeof value, 'string');
  }
  assert.ok(result.destination.lock_root_limbs.every(value => typeof value === 'string'));
  assert.equal(JSON.stringify(await encodeWithdrawalE2e(request)), JSON.stringify(result));
});

test('v1 PKH resolves through Node WASM without changing the machine protocol', async () => {
  const request = directRootRequest();
  request.destination = {
    kind: 'v1_pkh',
    value: 'AD6Mw1QUnPUrnVpyj2gW2jT6Jd6WsuZQmPn79XpZoFEocuvV12iDkvh',
  };

  const result = await encodeWithdrawalE2e(request);
  assert.equal(result.ok, true);
  assert.equal(result.destination.kind, 'v1_pkh');
  assert.equal(base58.decode(result.destination.lock_root).length, 40);
  assert.equal(result.calldata_byte_length, WITHDRAWAL_WIRE_V1.calldataLength);
  assert.equal(result.self_validation.valid, true);
});

test('strict request parser rejects malformed shape and numeric financial input', () => {
  const request = directRootRequest();
  assert.throws(
    () => parseWithdrawalE2eRequest({ ...request, unexpected: true }),
    error => hasErrorCode(error, 'invalid_request')
  );
  assert.throws(
    () => parseWithdrawalE2eRequest({ ...request, amount_base_units: 1_000_000 }),
    error => hasErrorCode(error, 'invalid_amount_type')
  );
  assert.throws(
    () => parseWithdrawalE2eRequest({ ...request, amount_base_units: '01' }),
    error => hasErrorCode(error, 'invalid_request')
  );
});

test('driver preserves official destination, amount, and binding rejection codes', async () => {
  const invalidRoot = directRootRequest();
  invalidRoot.destination = { kind: 'lock_root', value: base58.encode(new Uint8Array(32)) };
  await expectDriverError(() => encodeWithdrawalE2e(invalidRoot), 'invalid_lock_root');

  const outOfFieldBytes = new Uint8Array(40);
  new DataView(outOfFieldBytes.buffer).setBigUint64(0, WITHDRAWAL_WIRE_V1.tip5Prime, false);
  const outOfField = directRootRequest();
  outOfField.destination = { kind: 'lock_root', value: base58.encode(outOfFieldBytes) };
  await expectDriverError(() => encodeWithdrawalE2e(outOfField), 'invalid_lock_root');

  const invalidAddress = directRootRequest();
  invalidAddress.nock_token_address = '0x1234';
  await expectDriverError(() => encodeWithdrawalE2e(invalidAddress), 'invalid_address');

  const zeroAmount = directRootRequest();
  zeroAmount.amount_base_units = '0';
  await expectDriverError(() => encodeWithdrawalE2e(zeroAmount), 'amount_not_positive');

  const nonDivisible = directRootRequest();
  nonDivisible.amount_base_units = (WITHDRAWAL_POLICY_V1.minimumGrossBaseUnits + 1n).toString();
  await expectDriverError(() => encodeWithdrawalE2e(nonDivisible), 'amount_not_divisible');

  const belowMinimum = directRootRequest();
  belowMinimum.amount_base_units = (
    WITHDRAWAL_POLICY_V1.minimumGrossBaseUnits - WITHDRAWAL_POLICY_V1.baseUnitsPerNick
  ).toString();
  await expectDriverError(() => encodeWithdrawalE2e(belowMinimum), 'amount_below_minimum');

  const overflow = directRootRequest();
  overflow.amount_base_units = (
    (WITHDRAWAL_POLICY_V1.maximumNicks + 1n) *
    WITHDRAWAL_POLICY_V1.baseUnitsPerNick
  ).toString();
  await expectDriverError(() => encodeWithdrawalE2e(overflow), 'amount_overflow');

  const wrongToken = directRootRequest();
  wrongToken.expected.nock_token_address = '0x3333333333333333333333333333333333333333';
  await expectDriverError(() => encodeWithdrawalE2e(wrongToken), 'calldata_commitment_mismatch');

  const wrongBurner = directRootRequest();
  wrongBurner.expected.burner_address = '0x4444444444444444444444444444444444444444';
  await expectDriverError(() => encodeWithdrawalE2e(wrongBurner), 'calldata_commitment_mismatch');
});

test('driver rejects stale wire and policy identifiers before encoding', async () => {
  const wrongWire = directRootRequest();
  wrongWire.expected.wire_protocol = 'WithdrawalWireV0';
  await expectDriverError(() => encodeWithdrawalE2e(wrongWire), 'wire_protocol_mismatch');

  const wrongPolicy = directRootRequest();
  wrongPolicy.expected.withdrawal_policy = 'withdrawal-policy-v0';
  await expectDriverError(() => encodeWithdrawalE2e(wrongPolicy), 'withdrawal_policy_mismatch');
});

test('JSON CLI emits exactly one response object and keeps diagnostics off stdout', () => {
  const script = fileURLToPath(new URL('../dist/e2e/encode-withdrawal-e2e.js', import.meta.url));
  const requestJson = JSON.stringify(directRootRequest());
  const run = spawnSync(process.execPath, [script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    input: requestJson,
    encoding: 'utf8',
  });

  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stderr, '');
  assert.equal(run.stdout.split('\n').filter(Boolean).length, 1);
  const response = JSON.parse(run.stdout) as Record<string, unknown>;
  assert.equal(response.protocol, WITHDRAWAL_E2E_RESULT_PROTOCOL);
  assert.equal(response.ok, true);
  assert.equal(response.calldata, canonical.calldata);

  const pkhRequest = directRootRequest();
  pkhRequest.destination = {
    kind: 'v1_pkh',
    value: 'AD6Mw1QUnPUrnVpyj2gW2jT6Jd6WsuZQmPn79XpZoFEocuvV12iDkvh',
  };
  const wasmRun = spawnSync(process.execPath, [script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    input: JSON.stringify(pkhRequest),
    encoding: 'utf8',
  });
  assert.equal(wasmRun.status, 0, wasmRun.stderr);
  assert.equal(wasmRun.stderr, '');
  assert.equal(wasmRun.stdout.split('\n').filter(Boolean).length, 1);
  const wasmResponse = JSON.parse(wasmRun.stdout) as {
    ok: boolean;
    destination: { kind: string };
  };
  assert.equal(wasmResponse.ok, true);
  assert.equal(wasmResponse.destination.kind, 'v1_pkh');

  const malformed = spawnSync(process.execPath, [script], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    input: '{not-json',
    encoding: 'utf8',
  });
  assert.equal(malformed.status, 1);
  assert.equal(malformed.stdout.split('\n').filter(Boolean).length, 1);
  const failure = JSON.parse(malformed.stdout) as {
    ok: boolean;
    error: { code: string };
  };
  assert.equal(failure.ok, false);
  assert.equal(failure.error.code, 'invalid_json');
  assert.match(malformed.stderr, /invalid_json/);
});

test('JSON API returns structured errors without echoing malformed input', async () => {
  const malformed = await runWithdrawalE2eJson('{"secret":"do-not-echo"');
  assert.equal(malformed.ok, false);
  if (malformed.ok) {
    assert.fail('malformed response unexpectedly succeeded');
  }
  assert.equal(malformed.error.code, 'invalid_json');
  assert.doesNotMatch(JSON.stringify(malformed), /do-not-echo/);
});
