import type {
  BuildV0MigrationFromMnemonicResult,
  BuildV0MigrationTransactionResult,
  DerivedV0Address,
  QueryV0BalanceFromMnemonicResult,
  QueryV0BalanceResult,
} from './migration-types.js';
import type {
  Note,
  Nicks,
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

function sumNicks(notes: NoteV0[]): string {
  const total = notes.reduce((acc, note) => acc + BigInt(note.assets), 0n);
  return total.toString();
}

/**
 * Derive legacy v0 address metadata from mnemonic.
 *
 * v0 discovery queries use the base58-encoded bare public key ("sourceAddress").
 */
export function deriveV0AddressFromMnemonic(
  mnemonic: string,
  passphrase?: string,
  childIndex?: number
): DerivedV0Address {
  const master = wasm.deriveMasterKeyFromMnemonic(mnemonic, passphrase ?? '');
  const key = childIndex === undefined ? master : master.deriveChild(childIndex);
  const publicKey = Uint8Array.from(key.publicKey);

  return {
    sourceAddress: base58.encode(publicKey),
  };
}

/**
 * Query address balance and return only v0 (Legacy) notes.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function queryV0BalanceForAddress(
  grpcEndpoint: string,
  address: string
): Promise<QueryV0BalanceResult> {
  if (!address) {
    throw new Error('address is required');
  }

  const grpcClient = new wasm.GrpcClient(grpcEndpoint);
  const balance = await grpcClient.getBalanceByAddress(address);

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
 * Derive v0 discovery address from mnemonic and query legacy notes in one step.
 */
export async function queryV0BalanceFromMnemonic(
  mnemonic: string,
  grpcEndpoint: string,
  passphrase?: string,
  childIndex?: number
): Promise<QueryV0BalanceFromMnemonicResult> {
  const derived = deriveV0AddressFromMnemonic(mnemonic, passphrase, childIndex);
  const queried = await queryV0BalanceForAddress(grpcEndpoint, derived.sourceAddress);

  return {
    ...derived,
    ...queried,
  };
}

const DEFAULT_TX_ENGINE_SETTINGS: TxEngineSettings = {
  tx_engine_version: 1,
  tx_engine_patch: 0,
  min_fee: '256',
  cost_per_word: '32768',
  witness_word_div: 1,
};

/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function buildV0MigrationTransaction(
  v0Notes: NoteV0[],
  targetV1Pkh: string,
  feePerWord?: Nicks,
  includeLockData?: boolean,
  settings?: Partial<TxEngineSettings>
): Promise<BuildV0MigrationTransactionResult> {
  if (!v0Notes.length) {
    throw new Error('No v0 notes provided for migration');
  }

  const includeLockDataVal = !!includeLockData;
  const txSettings: TxEngineSettings = {
    ...DEFAULT_TX_ENGINE_SETTINGS,
    ...settings,
    cost_per_word: feePerWord ?? settings?.cost_per_word ?? DEFAULT_TX_ENGINE_SETTINGS.cost_per_word,
  };
  const targetSpendCondition = buildSinglePkhSpendCondition(targetV1Pkh);
  const builder = new wasm.TxBuilder(txSettings);

  for (const note of v0Notes) {
    const spendBuilder = new wasm.SpendBuilder(note, null, targetSpendCondition);
    // Use refund path to migrate full note value into target lock.
    spendBuilder.computeRefund(includeLockDataVal);
    builder.spend(spendBuilder);
  }

  builder.recalcAndSetFee(includeLockDataVal);
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
 * Derive v0 address, query legacy notes, and build migration transaction in one step.
 */
export async function buildV0MigrationFromMnemonic(
  mnemonic: string,
  grpcEndpoint: string,
  targetV1Pkh: string,
  passphrase?: string,
  childIndex?: number,
  feePerWord?: Nicks,
  includeLockData?: boolean,
  settings?: Partial<TxEngineSettings>
): Promise<BuildV0MigrationFromMnemonicResult> {
  const discovery = await queryV0BalanceFromMnemonic(mnemonic, grpcEndpoint, passphrase, childIndex);
  const built = await buildV0MigrationTransaction(
    discovery.v0Notes,
    targetV1Pkh,
    feePerWord,
    includeLockData,
    settings
  );

  return {
    ...built,
    discovery,
  };
}

export type {
  BuildV0MigrationFromMnemonicResult,
  BuildV0MigrationTransactionResult,
  DerivedV0Address,
  QueryV0BalanceFromMnemonicResult,
  QueryV0BalanceResult,
} from './migration-types.js';
