import type {
  BuildV0MigrationFromMnemonicParams,
  BuildV0MigrationFromMnemonicResult,
  BuildV0MigrationTransactionParams,
  BuildV0MigrationTransactionResult,
  DeriveV0AddressParams,
  DerivedV0Address,
  QueryV0BalanceParams,
  QueryV0BalanceFromMnemonicParams,
  QueryV0BalanceFromMnemonicResult,
  QueryV0BalanceResult,
} from './migration-types.js';
import type {
  Note,
  NoteV0,
  PbCom2BalanceEntry,
  RawTxV1,
  SpendCondition,
  TxEngineSettings,
  TxNotes,
} from '@nockbox/iris-wasm/iris_wasm.js';
import { base58 } from '@scure/base';
import * as wasm from './wasm.js';

function buildSinglePkhSpendCondition(pkh: string): SpendCondition {
  return [{ Pkh: { m: 1, hashes: [pkh] } }];
}

function isLegacyEntry(entry: PbCom2BalanceEntry): boolean {
  return !!entry.note?.note_version && 'Legacy' in entry.note.note_version;
}

function isNoteV0(note: Note): note is NoteV0 {
  return 'inner' in note && 'sig' in note && 'source' in note;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function sumNicks(notes: NoteV0[]): string {
  const total = notes.reduce((acc, note) => acc + BigInt(note.assets), 0n);
  return total.toString();
}

/**
 * Derive legacy v0 address metadata from mnemonic.
 *
 * v0 discovery queries use the base58-encoded bare public key ("sourceAddress").
 * We also expose the hashed PKH digest for callers that need lock condition metadata.
 */
export function deriveV0AddressFromMnemonic(params: DeriveV0AddressParams): DerivedV0Address {
  const master = wasm.deriveMasterKeyFromMnemonic(params.mnemonic, params.passphrase ?? '');
  const key = params.childIndex === undefined ? master : master.deriveChild(params.childIndex);
  const publicKey = Uint8Array.from(key.publicKey);

  return {
    sourceAddress: base58.encode(publicKey),
    sourcePkh: wasm.hashPublicKey(publicKey),
    publicKeyHex: toHex(publicKey),
  };
}

/**
 * Query address balance and return only v0 (Legacy) notes.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function queryV0BalanceForAddress(
  params: QueryV0BalanceParams
): Promise<QueryV0BalanceResult> {
  const sourceAddress = params.sourceAddress ?? params.sourcePkh;
  if (!sourceAddress) {
    throw new Error('sourceAddress is required');
  }

  const grpcClient = new wasm.GrpcClient(params.grpcEndpoint);
  const balance = await grpcClient.getBalanceByAddress(sourceAddress);

  const v0Notes: NoteV0[] = [];
  const entries = balance.notes ?? [];
  for (const entry of entries) {
    if (!isLegacyEntry(entry) || !entry.note) {
      continue;
    }
    const parsed = wasm.note_from_protobuf(entry.note);
    if (isNoteV0(parsed)) {
      v0Notes.push(parsed);
    }
  }

  return {
    balance,
    v0Notes,
    totalNicks: sumNicks(v0Notes),
  };
}

/**
 * Back-compat alias kept for older callers.
 * Despite the name, this resolves to address-based lookup via getBalanceByAddress.
 */
export async function queryV0BalanceForPkh(
  params: QueryV0BalanceParams
): Promise<QueryV0BalanceResult> {
  return queryV0BalanceForAddress(params);
}

/**
 * Derive v0 discovery address from mnemonic and query legacy notes in one step.
 */
export async function queryV0BalanceFromMnemonic(
  params: QueryV0BalanceFromMnemonicParams
): Promise<QueryV0BalanceFromMnemonicResult> {
  const derived = deriveV0AddressFromMnemonic(params);
  const queried = await queryV0BalanceForAddress({
    grpcEndpoint: params.grpcEndpoint,
    sourceAddress: derived.sourceAddress,
  });

  return {
    ...derived,
    ...queried,
  };
}

/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function buildV0MigrationTransaction(
  params: BuildV0MigrationTransactionParams
): Promise<BuildV0MigrationTransactionResult> {
  if (!params.v0Notes.length) {
    throw new Error('No v0 notes provided for migration');
  }

  const includeLockData = !!params.includeLockData;
  const costPerWord = params.feePerWord ?? '32768';

  const targetSpendCondition = buildSinglePkhSpendCondition(params.targetV1Pkh);
  const settings: TxEngineSettings = {
    tx_engine_version: 1,
    tx_engine_patch: 0,
    min_fee: '256',
    cost_per_word: costPerWord,
    witness_word_div: 1,
  };
  const builder = new wasm.TxBuilder(settings);

  for (const note of params.v0Notes) {
    const spendBuilder = new wasm.SpendBuilder(note, null, targetSpendCondition);
    // Use refund path to migrate full note value into target lock.
    spendBuilder.computeRefund(includeLockData);
    builder.spend(spendBuilder);
  }

  builder.recalcAndSetFee(includeLockData);
  const feeResult = builder.calcFee();
  const transaction = builder.build();
  const txNotes = builder.allNotes() as TxNotes;
  const txId = transaction.id;
  const rawTx: RawTxV1 = {
    version: 1,
    id: transaction.id,
    spends: transaction.spends,
  };

  return {
    transaction,
    txId,
    fee: feeResult,
    signRawTxPayload: {
      rawTx,
      notes: txNotes.notes.filter((note): note is NoteV0 => isNoteV0(note)),
      spendConditions: txNotes.spend_conditions,
    },
  };
}

/**
 * Derive v0 address, query legacy notes, and build migration transaction.
 */
export async function buildV0MigrationFromMnemonic(
  params: BuildV0MigrationFromMnemonicParams
): Promise<BuildV0MigrationFromMnemonicResult> {
  const discovery = await queryV0BalanceFromMnemonic(params);
  const built = await buildV0MigrationTransaction({
    v0Notes: discovery.v0Notes,
    targetV1Pkh: params.targetV1Pkh,
    feePerWord: params.feePerWord,
    includeLockData: params.includeLockData,
  });

  return {
    ...built,
    discovery,
  };
}

export type {
  BuildV0MigrationFromMnemonicParams,
  BuildV0MigrationFromMnemonicResult,
  BuildV0MigrationTransactionParams,
  BuildV0MigrationTransactionResult,
  DeriveV0AddressParams,
  DerivedV0Address,
  QueryV0BalanceParams,
  QueryV0BalanceFromMnemonicParams,
  QueryV0BalanceFromMnemonicResult,
  QueryV0BalanceResult,
} from './migration-types.js';
