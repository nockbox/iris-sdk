import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { base58 } from '@scure/base';

import {
  WITHDRAWAL_POLICY_V1,
  WITHDRAWAL_WIRE_V1,
  WithdrawalWireError,
  decodeWithdrawalWireV1,
  encodeWithdrawalWireV1,
  validateWithdrawalPolicyV1Amount,
  validateWithdrawalWireV1,
  withdrawalCommitmentV1,
  resolveWithdrawalDestinationV1,
  tip5LockRootLimbsFromBase58,
  type Tip5LockRootLimbs,
  type WithdrawalWireErrorCode,
  type WithdrawalWireV1Input,
} from '../src/withdrawal.js';
import { initWasm } from '../src/wasm.js';

interface ValidFixture {
  name: string;
  nock_token_address: string;
  burner_address: string;
  amount_base_units: string;
  lock_root_limbs: [string, string, string, string, string];
  selector: string;
  commitment: string;
  calldata: string;
}

interface AmountPolicyFixture {
  name: string;
  amount_base_units: string;
  expected: 'valid' | WithdrawalWireErrorCode;
  amount_nicks?: string;
  bridge_fee_nicks?: string;
  amount_after_bridge_fee_nicks?: string;
}

interface InvalidFixture {
  name: string;
  base_vector: string;
  calldata: string;
  expected_error: WithdrawalWireErrorCode;
}

interface WireFixture {
  schema_version: number;
  protocol: string;
  constants: {
    commitment_domain: string;
    calldata_length: number;
    base_calldata_length: number;
    trailer_magic_ascii: string;
    full_lock_root_length: number;
    tip5_prime: string;
    nock_base_units_per_nick: string;
  };
  valid_vectors: ValidFixture[];
  amount_policy_vectors: AmountPolicyFixture[];
  invalid_vectors: InvalidFixture[];
}

function loadFixture(): WireFixture {
  const path = new URL('../test-fixtures/withdrawal_wire_v1_vectors.json', import.meta.url);
  const raw = readFileSync(path, 'utf8');
  try {
    return JSON.parse(raw) as WireFixture;
  } catch (error) {
    throw new Error(
      `Failed to parse WithdrawalWireV1 fixture at ${path.pathname}: ${String(error)}`
    );
  }
}

const fixture = loadFixture();

function inputFromFixture(vector: ValidFixture): WithdrawalWireV1Input {
  return {
    nockTokenAddress: vector.nock_token_address,
    burnerAddress: vector.burner_address,
    amountBaseUnits: BigInt(vector.amount_base_units),
    lockRootLimbs: [
      BigInt(vector.lock_root_limbs[0]),
      BigInt(vector.lock_root_limbs[1]),
      BigInt(vector.lock_root_limbs[2]),
      BigInt(vector.lock_root_limbs[3]),
      BigInt(vector.lock_root_limbs[4]),
    ],
  };
}

function expectWireError(action: () => unknown, code: WithdrawalWireErrorCode): void {
  assert.throws(action, (error: unknown) => {
    assert.ok(error instanceof WithdrawalWireError);
    assert.equal(error.code, code);
    return true;
  });
}

test('fixture constants match WithdrawalWireV1', () => {
  assert.equal(fixture.schema_version, 1);
  assert.equal(fixture.protocol, WITHDRAWAL_WIRE_V1.protocol);
  assert.equal(fixture.constants.commitment_domain, WITHDRAWAL_WIRE_V1.commitmentDomain);
  assert.equal(fixture.constants.calldata_length, WITHDRAWAL_WIRE_V1.calldataLength);
  assert.equal(fixture.constants.base_calldata_length, WITHDRAWAL_WIRE_V1.baseCalldataLength);
  assert.equal(fixture.constants.trailer_magic_ascii, WITHDRAWAL_WIRE_V1.trailerMagic);
  assert.equal(fixture.constants.full_lock_root_length, WITHDRAWAL_WIRE_V1.fullLockRootLength);
  assert.equal(BigInt(fixture.constants.tip5_prime), WITHDRAWAL_WIRE_V1.tip5Prime);
  assert.equal(
    BigInt(fixture.constants.nock_base_units_per_nick),
    WITHDRAWAL_POLICY_V1.baseUnitsPerNick
  );
});

test('valid Rust vectors match the TypeScript codec byte-for-byte', () => {
  for (const vector of fixture.valid_vectors) {
    const input = inputFromFixture(vector);
    const encoded = encodeWithdrawalWireV1(input);

    assert.equal(encoded.selector, vector.selector, vector.name);
    assert.equal(encoded.commitment, vector.commitment, vector.name);
    assert.equal(encoded.calldata, vector.calldata, vector.name);
    assert.equal(withdrawalCommitmentV1(input), vector.commitment, vector.name);
    assert.deepEqual(encoded.lockRootLimbs, vector.lock_root_limbs.map(BigInt), vector.name);
    assert.deepEqual(validateWithdrawalWireV1(encoded.calldata, input), {
      protocol: WITHDRAWAL_WIRE_V1.protocol,
      selector: vector.selector,
      amountBaseUnits: BigInt(vector.amount_base_units),
      commitment: vector.commitment,
      trailerMagic: WITHDRAWAL_WIRE_V1.trailerMagic,
      lockRootLimbs: vector.lock_root_limbs.map(BigInt),
      calldata: vector.calldata,
    });
  }
});

test('malformed Rust vectors match the rejection taxonomy', () => {
  const vectorsByName = new Map(fixture.valid_vectors.map(vector => [vector.name, vector]));

  for (const invalid of fixture.invalid_vectors) {
    const base = vectorsByName.get(invalid.base_vector);
    assert.ok(base, `${invalid.name} references a known base vector`);
    const input = inputFromFixture(base);
    const action = invalid.expected_error.startsWith('calldata_')
      ? () => validateWithdrawalWireV1(invalid.calldata as `0x${string}`, input)
      : () => decodeWithdrawalWireV1(invalid.calldata as `0x${string}`);
    expectWireError(action, invalid.expected_error);
  }
});

test('official encoder rejects number amounts and stale account bindings', () => {
  const base = fixture.valid_vectors[0];
  const input = inputFromFixture(base);

  expectWireError(
    () =>
      encodeWithdrawalWireV1({
        ...input,
        amountBaseUnits: 100_000 as unknown as bigint,
      }),
    'invalid_amount_type'
  );
  expectWireError(
    () =>
      validateWithdrawalWireV1(base.calldata as `0x${string}`, {
        ...input,
        burnerAddress: '0x3333333333333333333333333333333333333333',
      }),
    'calldata_commitment_mismatch'
  );
});

test('policy v1 matches the shared amount boundary matrix', () => {
  for (const vector of fixture.amount_policy_vectors) {
    const amountBaseUnits = BigInt(vector.amount_base_units);
    if (vector.expected !== 'valid') {
      expectWireError(() => validateWithdrawalPolicyV1Amount(amountBaseUnits), vector.expected);
      continue;
    }

    assert.ok(vector.amount_nicks, `${vector.name} has amount nicks`);
    assert.ok(vector.bridge_fee_nicks, `${vector.name} has bridge fee`);
    assert.ok(vector.amount_after_bridge_fee_nicks, `${vector.name} has amount after bridge fee`);
    const result = validateWithdrawalPolicyV1Amount(amountBaseUnits);
    assert.equal(result.amountNicks, BigInt(vector.amount_nicks), vector.name);
    assert.equal(result.bridgeFeeNicks, BigInt(vector.bridge_fee_nicks), vector.name);
    assert.equal(
      result.amountAfterBridgeFeeNicks,
      BigInt(vector.amount_after_bridge_fee_nicks),
      vector.name
    );
  }
});

test('canonical direct lock root decodes to five big-endian Tip5 limbs', () => {
  const bytes = new Uint8Array(40);
  for (let index = 0; index < 5; index += 1) {
    bytes[index * 8 + 7] = index + 1;
  }
  const lockRoot = base58.encode(bytes);

  assert.deepEqual(tip5LockRootLimbsFromBase58(lockRoot), [1n, 2n, 3n, 4n, 5n]);
});

test('v1 PKH destination resolves through its canonical spend lock root', async () => {
  const destination = 'AD6Mw1QUnPUrnVpyj2gW2jT6Jd6WsuZQmPn79XpZoFEocuvV12iDkvh';
  const wasmBytes = readFileSync(
    new URL('../node_modules/@nockbox/iris-wasm/iris_wasm_bg.wasm', import.meta.url)
  );
  await initWasm({ module_or_path: wasmBytes });
  const resolved = await resolveWithdrawalDestinationV1({
    kind: 'v1_pkh',
    value: destination,
  });

  assert.equal(resolved.kind, 'v1_pkh');
  assert.equal(resolved.normalizedDestination, destination);
  assert.equal(base58.decode(resolved.lockRoot).length, 40);
  assert.equal(resolved.lockRootLimbs.length, 5);
  assert.deepEqual(resolved.lockRootLimbs, [
    12_977_106_315_425_463_920n,
    3_763_978_537_871_087_579n,
    1_234_138_158_316_650_842n,
    4_616_755_078_196_705_664n,
    5_093_069_046_709_966_084n,
  ]);
});

test('bytes32 pseudo-root is rejected', () => {
  assert.throws(
    () => tip5LockRootLimbsFromBase58(base58.encode(new Uint8Array(32))),
    error => error instanceof WithdrawalWireError && error.code === 'invalid_lock_root'
  );
});
