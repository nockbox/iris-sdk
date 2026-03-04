import type {
  BuildV0MigrationFromMnemonicResult,
  BuildV0MigrationTransactionResult,
  BuildV0MigrationSingleNoteResult,
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

const NOCK_TO_NICKS = 65_536;

function normalizeGrpcEndpoint(endpoint: string): string {
  const trimmed = endpoint?.trim() || '';
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
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
  try {
    const key = childIndex === undefined ? master : master.deriveChild(childIndex);
    try {
      const publicKey = Uint8Array.from(key.publicKey);
      const sourceAddress = base58.encode(publicKey);
      return { sourceAddress };
    } finally {
      if (key !== master) key.free();
    }
  } finally {
    master.free();
  }
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

  const normalizedEndpoint = normalizeGrpcEndpoint(grpcEndpoint);
  const grpcClient = new wasm.GrpcClient(normalizedEndpoint);
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
 * Tries master key first; if no Legacy notes found, retries with child index 0
 * (some v0 wallets used child derivation).
 */
export async function queryV0BalanceFromMnemonic(
  mnemonic: string,
  grpcEndpoint: string,
  passphrase?: string,
  childIndex?: number
): Promise<QueryV0BalanceFromMnemonicResult> {
  const derived = deriveV0AddressFromMnemonic(mnemonic, passphrase, childIndex);
  const queried = await queryV0BalanceForAddress(grpcEndpoint, derived.sourceAddress);

  if (queried.v0Notes.length > 0) {
    return { ...derived, ...queried };
  }

  if (childIndex === undefined) {
    const derivedChild0 = deriveV0AddressFromMnemonic(mnemonic, passphrase, 0);
    const queriedChild0 = await queryV0BalanceForAddress(grpcEndpoint, derivedChild0.sourceAddress);
    if (queriedChild0.v0Notes.length > 0) {
      return { ...derivedChild0, ...queriedChild0 };
    }
  }

  return { ...derived, ...queried };
}

/** Patch 1 (Bythos) - fee auto-calculated via recalcAndSetFee */
const DEFAULT_TX_ENGINE_SETTINGS: TxEngineSettings = {
  tx_engine_version: 1,
  tx_engine_patch: 1,
  min_fee: '256',
  cost_per_word: '16384', // 1 << 14
  witness_word_div: 4,
};

/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 *
 * @param options.singleNoteOnly - [TEMPORARY] When true, uses single-note logic for testing.
 * @param options.debug - [TEMPORARY] When true, logs the built result to console.
 */
export async function buildV0MigrationTransaction(
  v0Notes: NoteV0[],
  targetV1Pkh: string,
  feePerWord?: Nicks,
  includeLockData?: boolean,
  settings?: Partial<TxEngineSettings>,
  options?: { singleNoteOnly?: boolean; debug?: boolean }
): Promise<BuildV0MigrationTransactionResult | BuildV0MigrationSingleNoteResult> {
  if (!v0Notes.length) {
    throw new Error('No v0 notes provided for migration');
  }

  const singleNoteOnly = options?.singleNoteOnly ?? false;
  const debug = options?.debug ?? false;

  if (singleNoteOnly) {
    const result = await buildV0MigrationTransactionSingleNote(
      v0Notes,
      targetV1Pkh,
      feePerWord,
      settings,
      debug
    );
    return result;
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

  const inputNotes = txNotes.notes.filter((note): note is NoteV0 => isNoteV0(note));
  const spendConditions =
    txNotes.spend_conditions.length === inputNotes.length
      ? txNotes.spend_conditions
      : inputNotes.map(() => targetSpendCondition);
  const result: BuildV0MigrationTransactionResult = {
    transaction,
    txId,
    fee: feeResult,
    signRawTxPayload: {
      rawTx,
      notes: inputNotes,
      spendConditions,
    },
  };

  if (debug) {
    console.log('[SDK Migration] buildV0MigrationTransaction (full)', result);
  }

  return result;
}

/**
 * Single-note migration (same logic as regular path, but one note).
 * Picks any of the smallest notes (there may be multiple with the same size).
 */
async function buildV0MigrationTransactionSingleNote(
  v0Notes: NoteV0[],
  targetV1Pkh: string,
  feePerWord?: Nicks,
  settings?: Partial<TxEngineSettings>,
  debug?: boolean
): Promise<BuildV0MigrationSingleNoteResult> {
  const targetSpendCondition = buildSinglePkhSpendCondition(targetV1Pkh);
  const txSettings: TxEngineSettings = {
    ...DEFAULT_TX_ENGINE_SETTINGS,
    ...settings,
    cost_per_word: feePerWord ?? settings?.cost_per_word ?? DEFAULT_TX_ENGINE_SETTINGS.cost_per_word,
  };
  const builder = new wasm.TxBuilder(txSettings);

  const candidates: Array<{ note: NoteV0; assets: bigint }> = v0Notes.map(note => ({
    note,
    assets: BigInt(note.assets),
  }));

  if (!candidates.length) {
    throw new Error('No v0 notes to migrate.');
  }

  const minAssets = candidates.reduce((min, c) => (c.assets < min ? c.assets : min), candidates[0].assets);
  const selected = candidates.find(c => c.assets === minAssets)!;

  const spendBuilder = new wasm.SpendBuilder(selected.note, null, targetSpendCondition);
  spendBuilder.computeRefund(false);
  builder.spend(spendBuilder);

  builder.recalcAndSetFee(false);
  const feeNicks = builder.calcFee();
  const transaction = builder.build();
  const txNotes = builder.allNotes() as TxNotes;
  const rawTx: RawTxV1 = {
    version: 1,
    id: transaction.id,
    spends: transaction.spends,
  };

  const feeNicksBigInt = BigInt(feeNicks);
  const inputNotes = txNotes.notes.filter((note): note is NoteV0 => isNoteV0(note));
  const spendConditions =
    txNotes.spend_conditions.length === inputNotes.length
      ? txNotes.spend_conditions
      : inputNotes.map(() => targetSpendCondition);
  const result: BuildV0MigrationSingleNoteResult = {
    transaction,
    txId: transaction.id,
    fee: feeNicks,
    migratedNicks: selected.assets.toString(),
    migratedNock: Number(selected.assets) / NOCK_TO_NICKS,
    selectedNoteNicks: selected.assets.toString(),
    selectedNoteNock: Number(selected.assets) / NOCK_TO_NICKS,
    feeNock: Number(feeNicksBigInt) / NOCK_TO_NICKS,
    signRawTxPayload: {
      rawTx,
      notes: inputNotes,
      spendConditions,
    },
  };

  if (debug) {
    console.log('[SDK Migration] buildV0MigrationTransactionSingleNote', result);
  }

  return result;
}

/**
 * Derive v0 address, query legacy notes, and build migration transaction in one step.
 *
 * @param options.singleNoteOnly - [TEMPORARY] When true, migrates 200 NOCK from one note.
 * @param options.debug - [TEMPORARY] When true, logs the built result to console.
 */
export async function buildV0MigrationFromMnemonic(
  mnemonic: string,
  grpcEndpoint: string,
  targetV1Pkh: string,
  passphrase?: string,
  childIndex?: number,
  feePerWord?: Nicks,
  includeLockData?: boolean,
  settings?: Partial<TxEngineSettings>,
  options?: { singleNoteOnly?: boolean; debug?: boolean }
): Promise<BuildV0MigrationFromMnemonicResult> {
  const discovery = await queryV0BalanceFromMnemonic(mnemonic, grpcEndpoint, passphrase, childIndex);
  const buildOptions = options?.singleNoteOnly
    ? { singleNoteOnly: true as const, debug: options?.debug }
    : { debug: options?.debug };
  const built = await buildV0MigrationTransaction(
    discovery.v0Notes,
    targetV1Pkh,
    feePerWord,
    includeLockData,
    settings,
    buildOptions
  );

  const result = {
    ...built,
    discovery,
  };

  if (options?.debug) {
    console.log('[SDK Migration] buildV0MigrationFromMnemonic', result);
  }

  return result;
}

/**
 * Build migration from protobuf notes (matches extension API).
 * Caller must have initialized WASM before using.
 */
export async function buildV0MigrationTransactionFromNotes(
  v0NotesProtobuf: unknown[],
  targetV1Pkh: string,
  feePerWord: Nicks = '32768',
  options?: { debug?: boolean }
): Promise<BuildV0MigrationSingleNoteResult> {
  const v0Notes: NoteV0[] = [];
  for (const notePb of v0NotesProtobuf) {
    const parsed = wasm.note_from_protobuf(notePb as Parameters<typeof wasm.note_from_protobuf>[0]);
    if (isNoteV0(parsed)) {
      v0Notes.push(parsed);
    }
  }

  const result = await buildV0MigrationTransactionSingleNote(
    v0Notes,
    targetV1Pkh,
    feePerWord,
    undefined,
    options?.debug ?? false
  );

  return result;
}

export type {
  BuildV0MigrationFromMnemonicResult,
  BuildV0MigrationTransactionResult,
  BuildV0MigrationSingleNoteResult,
  DerivedV0Address,
  QueryV0BalanceFromMnemonicResult,
  QueryV0BalanceResult,
} from './migration-types.js';
