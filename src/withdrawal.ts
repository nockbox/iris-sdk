import { keccak_256 } from '@noble/hashes/sha3.js';
import { base58 } from '@scure/base';
import {
  digestToProtobuf,
  initWasm,
  pkhSingle,
  spendConditionHash,
  spendConditionNewPkh,
} from './wasm.js';
import type { Digest, PbCom1Belt } from './wasm.js';

export const WITHDRAWAL_WIRE_V1 = {
  protocol: 'WithdrawalWireV1',
  selector: '0xbcf64e05',
  commitmentDomain: 'nock-withdrawal-calldata-v1',
  trailerMagic: 'NOCKWD1!',
  baseCalldataLength: 68,
  fullLockRootLength: 40,
  calldataLength: 116,
  tip5Prime: 0xffff_ffff_0000_0001n,
} as const;

export const WITHDRAWAL_POLICY_V1 = {
  policy: 'withdrawal-policy-v1',
  baseUnitsPerNock: 10_000_000_000_000_000n,
  nicksPerNock: 65_536n,
  baseUnitsPerNick: 152_587_890_625n,
  minimumGrossNocks: 100_000n,
  minimumGrossNicks: 6_553_600_000n,
  minimumGrossBaseUnits: 1_000_000_000_000_000_000_000n,
  bridgeFeeNicksPerStartedNock: 195n,
  maximumNicks: 0xffff_ffff_ffff_ffffn,
} as const;

export type Hex = `0x${string}`;
export type Tip5LockRootLimbs = readonly [bigint, bigint, bigint, bigint, bigint];

export type WithdrawalDestinationV1 =
  | { kind: 'v1_pkh'; value: string }
  | { kind: 'lock_root'; value: string };

export interface ResolvedWithdrawalDestinationV1 {
  kind: WithdrawalDestinationV1['kind'];
  normalizedDestination: string;
  lockRoot: string;
  lockRootLimbs: Tip5LockRootLimbs;
}

export type WithdrawalWireErrorCode =
  | 'invalid_address'
  | 'invalid_amount_type'
  | 'amount_not_positive'
  | 'amount_not_divisible'
  | 'amount_below_minimum'
  | 'amount_overflow'
  | 'non_positive_payout'
  | 'invalid_lock_root'
  | 'missing_calldata_trailer'
  | 'malformed_calldata'
  | 'calldata_amount_mismatch'
  | 'calldata_commitment_mismatch'
  | 'lock_root_mismatch';

export class WithdrawalWireError extends Error {
  readonly code: WithdrawalWireErrorCode;

  constructor(code: WithdrawalWireErrorCode, message: string) {
    super(message);
    this.name = 'WithdrawalWireError';
    this.code = code;
    Object.setPrototypeOf(this, WithdrawalWireError.prototype);
  }
}

export interface WithdrawalWireV1Input {
  nockTokenAddress: string;
  burnerAddress: string;
  amountBaseUnits: bigint;
  lockRootLimbs: Tip5LockRootLimbs;
}

export interface WithdrawalPolicyV1Amount {
  amountBaseUnits: bigint;
  amountNicks: bigint;
  bridgeFeeNicks: bigint;
  amountAfterBridgeFeeNicks: bigint;
}

export interface DecodedWithdrawalWireV1 {
  protocol: 'WithdrawalWireV1';
  selector: Hex;
  amountBaseUnits: bigint;
  commitment: Hex;
  trailerMagic: 'NOCKWD1!';
  lockRootLimbs: Tip5LockRootLimbs;
  calldata: Hex;
}

export interface EncodedWithdrawalWireV1 extends DecodedWithdrawalWireV1 {
  nockTokenAddress: Hex;
  burnerAddress: Hex;
  amountNicks: bigint;
  bridgeFeeNicks: bigint;
}

interface NormalizedWithdrawalWireV1Input {
  nockTokenAddress: Hex;
  nockTokenAddressBytes: Uint8Array;
  burnerAddress: Hex;
  burnerAddressBytes: Uint8Array;
  amountBaseUnits: bigint;
  amountBytes: Uint8Array;
  amountPolicy: WithdrawalPolicyV1Amount;
  lockRootLimbs: Tip5LockRootLimbs;
  lockRootBytes: Uint8Array;
}

const SELECTOR_BYTES = hexToBytes(WITHDRAWAL_WIRE_V1.selector, 'selector');
const TRAILER_MAGIC_BYTES = new TextEncoder().encode(WITHDRAWAL_WIRE_V1.trailerMagic);
const COMMITMENT_DOMAIN_BYTES = new TextEncoder().encode(WITHDRAWAL_WIRE_V1.commitmentDomain);

export function validateWithdrawalPolicyV1Amount(
  amountBaseUnits: bigint
): WithdrawalPolicyV1Amount {
  if (typeof amountBaseUnits !== 'bigint') {
    throw new WithdrawalWireError(
      'invalid_amount_type',
      'Withdrawal amount must be a bigint in wrapped-NOCK base units'
    );
  }
  if (amountBaseUnits <= 0n) {
    throw new WithdrawalWireError('amount_not_positive', 'Withdrawal amount must be positive');
  }
  if (amountBaseUnits % WITHDRAWAL_POLICY_V1.baseUnitsPerNick !== 0n) {
    throw new WithdrawalWireError(
      'amount_not_divisible',
      `Withdrawal amount must be divisible by ${WITHDRAWAL_POLICY_V1.baseUnitsPerNick} base units per nick`
    );
  }

  const amountNicks = amountBaseUnits / WITHDRAWAL_POLICY_V1.baseUnitsPerNick;
  if (amountNicks > WITHDRAWAL_POLICY_V1.maximumNicks) {
    throw new WithdrawalWireError(
      'amount_overflow',
      'Withdrawal amount exceeds the backend u64 nick representation'
    );
  }
  if (amountNicks < WITHDRAWAL_POLICY_V1.minimumGrossNicks) {
    throw new WithdrawalWireError(
      'amount_below_minimum',
      `Withdrawal amount is below the inclusive ${WITHDRAWAL_POLICY_V1.minimumGrossNocks}-NOCK minimum`
    );
  }

  const startedNocks =
    (amountNicks + WITHDRAWAL_POLICY_V1.nicksPerNock - 1n) / WITHDRAWAL_POLICY_V1.nicksPerNock;
  const bridgeFeeNicks = startedNocks * WITHDRAWAL_POLICY_V1.bridgeFeeNicksPerStartedNock;
  const amountAfterBridgeFeeNicks = amountNicks - bridgeFeeNicks;
  if (amountAfterBridgeFeeNicks <= 0n) {
    throw new WithdrawalWireError(
      'non_positive_payout',
      'Withdrawal bridge fee leaves no positive amount for payout and transaction fees'
    );
  }

  return {
    amountBaseUnits,
    amountNicks,
    bridgeFeeNicks,
    amountAfterBridgeFeeNicks,
  };
}

export function withdrawalCommitmentV1(input: WithdrawalWireV1Input): Hex {
  const normalized = normalizeInput(input);
  return bytesToHex(
    keccak_256(
      concatBytes(
        COMMITMENT_DOMAIN_BYTES,
        normalized.nockTokenAddressBytes,
        normalized.burnerAddressBytes,
        normalized.amountBytes,
        normalized.lockRootBytes
      )
    )
  );
}

export function encodeWithdrawalWireV1(input: WithdrawalWireV1Input): EncodedWithdrawalWireV1 {
  const normalized = normalizeInput(input);
  const commitmentBytes = keccak_256(
    concatBytes(
      COMMITMENT_DOMAIN_BYTES,
      normalized.nockTokenAddressBytes,
      normalized.burnerAddressBytes,
      normalized.amountBytes,
      normalized.lockRootBytes
    )
  );
  const calldataBytes = concatBytes(
    SELECTOR_BYTES,
    normalized.amountBytes,
    commitmentBytes,
    TRAILER_MAGIC_BYTES,
    normalized.lockRootBytes
  );

  const decoded = validateWithdrawalWireV1(calldataBytes, input);
  return {
    ...decoded,
    nockTokenAddress: normalized.nockTokenAddress,
    burnerAddress: normalized.burnerAddress,
    amountNicks: normalized.amountPolicy.amountNicks,
    bridgeFeeNicks: normalized.amountPolicy.bridgeFeeNicks,
  };
}

export function decodeWithdrawalWireV1(calldata: Hex | Uint8Array): DecodedWithdrawalWireV1 {
  const bytes = typeof calldata === 'string' ? hexToBytes(calldata, 'calldata') : calldata.slice();
  if (bytes.length === WITHDRAWAL_WIRE_V1.baseCalldataLength) {
    throw new WithdrawalWireError(
      'missing_calldata_trailer',
      `Withdrawal calldata is missing the ${WITHDRAWAL_WIRE_V1.trailerMagic} trailer`
    );
  }
  if (bytes.length !== WITHDRAWAL_WIRE_V1.calldataLength) {
    throw new WithdrawalWireError(
      'malformed_calldata',
      `Withdrawal calldata must be exactly ${WITHDRAWAL_WIRE_V1.calldataLength} bytes, got ${bytes.length}`
    );
  }
  if (!equalBytes(bytes.subarray(0, 4), SELECTOR_BYTES)) {
    throw new WithdrawalWireError(
      'malformed_calldata',
      'Withdrawal calldata selector is not burn(uint256,bytes32)'
    );
  }
  if (!equalBytes(bytes.subarray(68, 76), TRAILER_MAGIC_BYTES)) {
    throw new WithdrawalWireError(
      'malformed_calldata',
      `Withdrawal calldata is missing the ${WITHDRAWAL_WIRE_V1.trailerMagic} magic`
    );
  }

  const lockRootLimbs: Tip5LockRootLimbs = [
    bytesToBigint(bytes.subarray(76, 84)),
    bytesToBigint(bytes.subarray(84, 92)),
    bytesToBigint(bytes.subarray(92, 100)),
    bytesToBigint(bytes.subarray(100, 108)),
    bytesToBigint(bytes.subarray(108, 116)),
  ];
  validateLockRootLimbs(lockRootLimbs);

  return {
    protocol: 'WithdrawalWireV1',
    selector: bytesToHex(bytes.subarray(0, 4)),
    amountBaseUnits: bytesToBigint(bytes.subarray(4, 36)),
    commitment: bytesToHex(bytes.subarray(36, 68)),
    trailerMagic: 'NOCKWD1!',
    lockRootLimbs,
    calldata: bytesToHex(bytes),
  };
}

export function validateWithdrawalWireV1(
  calldata: Hex | Uint8Array,
  expected: WithdrawalWireV1Input
): DecodedWithdrawalWireV1 {
  const decoded = decodeWithdrawalWireV1(calldata);
  const normalized = normalizeInput(expected);

  if (decoded.amountBaseUnits !== normalized.amountBaseUnits) {
    throw new WithdrawalWireError(
      'calldata_amount_mismatch',
      'Withdrawal calldata amount does not match the current request'
    );
  }
  if (!equalBigintTuples(decoded.lockRootLimbs, normalized.lockRootLimbs)) {
    throw new WithdrawalWireError(
      'lock_root_mismatch',
      'Withdrawal calldata destination does not match the current request'
    );
  }

  const expectedCommitment = bytesToHex(
    keccak_256(
      concatBytes(
        COMMITMENT_DOMAIN_BYTES,
        normalized.nockTokenAddressBytes,
        normalized.burnerAddressBytes,
        normalized.amountBytes,
        normalized.lockRootBytes
      )
    )
  );
  if (decoded.commitment !== expectedCommitment) {
    throw new WithdrawalWireError(
      'calldata_commitment_mismatch',
      'Withdrawal calldata commitment does not match token, burner, amount, and destination'
    );
  }

  return decoded;
}

export function tip5LockRootLimbsFromBase58(lockRoot: string): Tip5LockRootLimbs {
  const normalized = normalizeTip5Digest(lockRoot, 'Nockchain lock root');
  const bytes = base58.decode(normalized);
  const limbs: Tip5LockRootLimbs = [
    bytesToBigint(bytes.subarray(0, 8)),
    bytesToBigint(bytes.subarray(8, 16)),
    bytesToBigint(bytes.subarray(16, 24)),
    bytesToBigint(bytes.subarray(24, 32)),
    bytesToBigint(bytes.subarray(32, 40)),
  ];
  validateLockRootLimbs(limbs);
  return limbs;
}

function tip5LockRootLimbsFromDigest(digest: Digest): Tip5LockRootLimbs {
  const protobuf = digestToProtobuf(digest);
  const belts: readonly (PbCom1Belt | null | undefined)[] = [
    protobuf.belt_1,
    protobuf.belt_2,
    protobuf.belt_3,
    protobuf.belt_4,
    protobuf.belt_5,
  ];
  const beltValue = (belt: PbCom1Belt | null | undefined): bigint => {
    const value = belt?.value;
    if (typeof value !== 'string') {
      throw new WithdrawalWireError(
        'invalid_lock_root',
        'Nockchain lock root did not decode to five Tip5 limbs'
      );
    }
    return BigInt(value);
  };
  const limbs: Tip5LockRootLimbs = [
    beltValue(belts[0]),
    beltValue(belts[1]),
    beltValue(belts[2]),
    beltValue(belts[3]),
    beltValue(belts[4]),
  ];
  validateLockRootLimbs(limbs);
  return limbs;
}

export async function resolveWithdrawalDestinationV1(
  destination: WithdrawalDestinationV1
): Promise<ResolvedWithdrawalDestinationV1> {
  const normalizedDestination = normalizeTip5Digest(
    destination.value,
    destination.kind === 'v1_pkh' ? 'Nockchain v1 PKH address' : 'Nockchain lock root'
  );

  let lockRoot = normalizedDestination;
  let lockRootLimbs: Tip5LockRootLimbs;
  if (destination.kind === 'v1_pkh') {
    await initWasm();
    const spendCondition = spendConditionNewPkh(pkhSingle(normalizedDestination as Digest));
    const derivedLockRoot = spendConditionHash(spendCondition);
    lockRoot = normalizeTip5Digest(String(derivedLockRoot), 'derived Nockchain lock root');
    lockRootLimbs = tip5LockRootLimbsFromDigest(derivedLockRoot);
  } else {
    lockRootLimbs = tip5LockRootLimbsFromBase58(lockRoot);
  }

  return {
    kind: destination.kind,
    normalizedDestination,
    lockRoot,
    lockRootLimbs,
  };
}

function normalizeTip5Digest(value: string, label: string): string {
  const normalized = value.trim();
  let bytes: Uint8Array;
  try {
    bytes = base58.decode(normalized);
  } catch {
    throw new WithdrawalWireError('invalid_lock_root', `${label} must be canonical base58`);
  }
  if (bytes.length !== WITHDRAWAL_WIRE_V1.fullLockRootLength) {
    throw new WithdrawalWireError(
      'invalid_lock_root',
      `${label} must decode to exactly ${WITHDRAWAL_WIRE_V1.fullLockRootLength} bytes`
    );
  }
  if (base58.encode(bytes) !== normalized) {
    throw new WithdrawalWireError(
      'invalid_lock_root',
      `${label} must use canonical base58 encoding`
    );
  }
  return normalized;
}

function normalizeInput(input: WithdrawalWireV1Input): NormalizedWithdrawalWireV1Input {
  const nockTokenAddress = normalizeAddress(input.nockTokenAddress, 'Nock token address');
  const burnerAddress = normalizeAddress(input.burnerAddress, 'burner address');
  const amountPolicy = validateWithdrawalPolicyV1Amount(input.amountBaseUnits);
  validateLockRootLimbs(input.lockRootLimbs);

  return {
    nockTokenAddress,
    nockTokenAddressBytes: hexToBytes(nockTokenAddress, 'Nock token address'),
    burnerAddress,
    burnerAddressBytes: hexToBytes(burnerAddress, 'burner address'),
    amountBaseUnits: input.amountBaseUnits,
    amountBytes: bigintToFixedBytes(input.amountBaseUnits, 32, 'withdrawal amount'),
    amountPolicy,
    lockRootLimbs: input.lockRootLimbs,
    lockRootBytes: concatBytes(
      ...input.lockRootLimbs.map(limb => bigintToFixedBytes(limb, 8, 'Tip5 limb'))
    ),
  };
}

function normalizeAddress(value: string, label: string): Hex {
  const normalized = value.trim().toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(normalized)) {
    throw new WithdrawalWireError('invalid_address', `${label} must be a 20-byte 0x address`);
  }
  return normalized as Hex;
}

function validateLockRootLimbs(limbs: readonly bigint[]): asserts limbs is Tip5LockRootLimbs {
  if (!Array.isArray(limbs) || limbs.length !== 5) {
    throw new WithdrawalWireError(
      'invalid_lock_root',
      'Withdrawal destination must contain exactly five Tip5 limbs'
    );
  }
  for (const [index, limb] of limbs.entries()) {
    if (typeof limb !== 'bigint' || limb < 0n || limb >= WITHDRAWAL_WIRE_V1.tip5Prime) {
      throw new WithdrawalWireError(
        'invalid_lock_root',
        `Withdrawal destination limb ${index} is outside the Tip5 base field`
      );
    }
  }
}

function hexToBytes(value: string, label: string): Uint8Array {
  if (!/^0x(?:[0-9a-fA-F]{2})*$/.test(value)) {
    throw new WithdrawalWireError('malformed_calldata', `${label} must be even-length 0x hex`);
  }
  const body = value.slice(2);
  const bytes = new Uint8Array(body.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(body.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): Hex {
  let body = '';
  for (const byte of bytes) body += byte.toString(16).padStart(2, '0');
  return `0x${body}`;
}

function bigintToFixedBytes(value: bigint, length: number, label: string): Uint8Array {
  if (typeof value !== 'bigint' || value < 0n || value > (1n << BigInt(length * 8)) - 1n) {
    throw new WithdrawalWireError('malformed_calldata', `${label} does not fit ${length} bytes`);
  }
  const bytes = new Uint8Array(length);
  let remaining = value;
  for (let index = length - 1; index >= 0; index -= 1) {
    bytes[index] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return bytes;
}

function bytesToBigint(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  return value;
}

function concatBytes(...parts: readonly Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function equalBigintTuples(left: readonly bigint[], right: readonly bigint[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
