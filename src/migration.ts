import type {
  BuildV0MigrationTxResult,
  DerivedV0Address,
  V0BalanceResult,
} from './migration-types.js';
import type {
  Nicks,
  NoteV0,
  PbCom2Note,
  RawTxV1,
  SpendCondition,
  Digest,
  TxEngineSettings,
} from '@nockbox/iris-wasm/iris_wasm.js';
import { base58 } from '@scure/base';
import * as wasm from './wasm.js';
import * as guard from '@nockbox/iris-wasm/iris_wasm.guard';
import { NOCK_TO_NICKS } from './constants.js';

function buildSinglePkhSpendCondition(pkh: Digest): SpendCondition {
  const pkhObj = wasm.pkhSingle(pkh);
  return wasm.spendConditionNewPkh(pkhObj);
}

function sumNicks(notes: NoteV0[]): Nicks {
  const total = notes.reduce((acc, note) => acc + BigInt(note.assets), 0n);
  return total.toString() as Nicks;
}

function parseV0Note(note?: PbCom2Note | null): NoteV0 | null {
  if (!note) return null;
  const parsed = wasm.noteFromProtobuf(note);
  return guard.isNoteV0(parsed) ? parsed : null;
}

/**
 * Derive legacy v0 WASM public key from mnemonic.
 */
export function deriveV0AddressFromMnemonic(mnemonic: string): DerivedV0Address {
  const master = wasm.deriveMasterKeyFromMnemonic(mnemonic);
  try {
    return wasm.publicKeyFromBeBytes(Uint8Array.from(master.publicKey));
  } finally {
    master.free();
  }
}

/**
 * Query v0 (Legacy) balance for a mnemonic. Discovery only; does not build a transaction.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function queryV0Balance(
  mnemonic: string,
  grpcEndpoint: string
): Promise<V0BalanceResult> {
  const sourcePublicKey = deriveV0AddressFromMnemonic(mnemonic);
  const sourceAddress = base58.encode(wasm.publicKeyToBeBytesVec(sourcePublicKey));
  const grpcClient = new wasm.GrpcClient(grpcEndpoint);
  const balance = await grpcClient.getBalanceByAddress(sourceAddress);

  const v0Notes: NoteV0[] = [];
  const entries = balance.notes ?? [];
  for (const entry of entries) {
    const parsedV0 = parseV0Note(entry.note);
    if (parsedV0) v0Notes.push(parsedV0);
  }

  const totalNicks = sumNicks(v0Notes);
  const totalNock = Number(BigInt(totalNicks)) / NOCK_TO_NICKS;
  const smallestNoteNock =
    v0Notes.length > 0
      ? Number(
          v0Notes.reduce(
            (min, n) => (BigInt(n.assets) < min ? BigInt(n.assets) : min),
            BigInt(v0Notes[0].assets)
          )
        ) / NOCK_TO_NICKS
      : undefined;

  return {
    sourceAddress,
    balance,
    v0Notes,
    totalNicks,
    totalNock,
    smallestNoteNock,
    rawNotesFromRpc: entries.length,
  };
}

function defaultTxEngineSettings(): TxEngineSettings {
  return wasm.txEngineSettingsV1BythosDefault();
}

/**
 * Fetch v0 balance and optionally build migration tx to a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 *
 * @param targetV1Pkh - When provided, builds the migration tx. Omit for balance only.
 * @param options.debug - When true, logs the built result to console.
 */
export async function buildV0MigrationTx(
  mnemonic: string,
  grpcEndpoint: string,
  targetV1Pkh?: Digest,
  options?: { debug?: boolean }
): Promise<BuildV0MigrationTxResult> {
  const balanceResult = await queryV0Balance(mnemonic, grpcEndpoint);
  if (!targetV1Pkh) {
    return balanceResult;
  }

  const debug = options?.debug ?? false;
  const useSingleNote = debug;

  try {
    const v0Notes = balanceResult.v0Notes;
    if (!v0Notes.length) {
      throw new Error('No v0 notes to migrate');
    }

    const notesToUse: NoteV0[] = useSingleNote
      ? (() => {
          const sorted = [...v0Notes]
            .map(n => ({ note: n, assets: BigInt(n.assets) }))
            .sort((a, b) => (a.assets < b.assets ? -1 : a.assets > b.assets ? 1 : 0));
          return [sorted[0].note];
        })()
      : v0Notes;

    const txSettings = defaultTxEngineSettings();
    const targetSpendCondition = buildSinglePkhSpendCondition(targetV1Pkh);
    const refundLock = wasm.lockHash(targetSpendCondition);
    const builder = new wasm.TxBuilder(txSettings);

    for (const note of notesToUse) {
      const spendBuilder = new wasm.SpendBuilder(note, null, null, refundLock);
      spendBuilder.computeRefund(false);
      builder.spend(spendBuilder);
    }

    builder.recalcAndSetFee(false);
    const feeNicks = builder.curFee();
    const transaction = builder.build();
    const rawTx: RawTxV1 = wasm.nockchainTxToRawTx(transaction);

    const inputNotes = notesToUse;
    const feeNock = Number(BigInt(feeNicks)) / NOCK_TO_NICKS;

    const migrated = useSingleNote
      ? (() => {
          const note = notesToUse[0];
          const nock = Number(BigInt(note.assets)) / NOCK_TO_NICKS;
          return {
            migratedNicks: note.assets,
            migratedNock: nock,
          };
        })()
      : {
          migratedNicks: (BigInt(balanceResult.totalNicks) - BigInt(feeNicks)).toString() as Nicks,
          migratedNock: balanceResult.totalNock - feeNock,
        };

    const result: BuildV0MigrationTxResult = {
      ...balanceResult,
      txId: transaction.id,
      fee: feeNicks,
      feeNock,
      signRawTxPayload: {
        rawTx,
        notes: inputNotes,
        spendConditions: inputNotes.map(() => null),
        refundLock,
      },
      ...migrated,
    };

    if (debug) {
      console.log('[SDK Migration] buildV0MigrationTx', result);
    }
    return result;
  } catch (e) {
    console.warn('[SDK Migration] Build failed, returning balance only:', e);
    return balanceResult;
  }
}

export type {
  BuildV0MigrationTxResult,
  DerivedV0Address,
  V0BalanceResult,
} from './migration-types.js';
