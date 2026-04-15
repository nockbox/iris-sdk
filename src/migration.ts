import type {
  BuildV0MigrationTxResult,
  BuildV0MigrationTxOptions,
  V0BalanceResult,
  V0MigrationTxSignPayload,
} from './migration-types.js';
import type {
  Nicks,
  NoteV0,
  PbCom2Note,
  PublicKey,
  RawTxV1,
  SpendCondition,
  Digest,
  Lock,
  LockRoot,
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

function appendV0MigrationSpends(
  builder: wasm.TxBuilder,
  notes: NoteV0[],
  spendConditions: (SpendCondition | null)[] | undefined,
  refundLock: LockRoot
): void {
  for (let i = 0; i < notes.length; i++) {
    const spendBuilder = new wasm.SpendBuilder(
      notes[i],
      (spendConditions?.[i] ?? null) as Lock | null,
      null,
      refundLock
    );
    spendBuilder.computeRefund(false);
    builder.spend(spendBuilder);
  }
}

/**
 * Reconstruct a `TxBuilder` from {@link BuildV0MigrationTxResult.v0MigrationTxSignPayload},
 * using the same `txEngineSettings` that were used to build the unsigned tx (e.g. for fee iteration / signing).
 */
export function buildV0MigrationTxBuilderFromPayload(
  payload: V0MigrationTxSignPayload,
  txEngineSettings: TxEngineSettings
): wasm.TxBuilder {
  const builder = new wasm.TxBuilder(txEngineSettings);
  appendV0MigrationSpends(builder, payload.notes, payload.spendConditions, payload.refundLock);
  return builder;
}

/**
 * Query v0 (Legacy) balance for a v0 public key. Discovery only; does not build a transaction.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function queryV0Balance(
  sourcePublicKey: PublicKey,
  grpcEndpoint: string
): Promise<V0BalanceResult> {
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

/**
 * Build a v0→v1 migration transaction to `targetV1Pkh` (after querying balance on-chain).
 * For balance only, use {@link queryV0Balance}.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 *
 * @param options.maxNotes - Optional cap on number of smallest legacy notes to include.
 */
export async function buildV0MigrationTx(
  sourcePublicKey: PublicKey,
  grpcEndpoint: string,
  targetV1Pkh: Digest,
  options: BuildV0MigrationTxOptions
): Promise<BuildV0MigrationTxResult> {
  const balanceResult = await queryV0Balance(sourcePublicKey, grpcEndpoint);
  const maxNotes = options.maxNotes;

  try {
    const v0Notes = balanceResult.v0Notes;
    if (!v0Notes.length) {
      throw new Error('No v0 notes to migrate');
    }

    const sortedNotes = [...v0Notes]
      .map(note => ({ note, assets: BigInt(note.assets) }))
      .sort((a, b) => (a.assets < b.assets ? -1 : a.assets > b.assets ? 1 : 0));

    const notesToUse: NoteV0[] =
      typeof maxNotes === 'number' && Number.isFinite(maxNotes) && maxNotes > 0
        ? sortedNotes.slice(0, Math.floor(maxNotes)).map(entry => entry.note)
        : sortedNotes.map(entry => entry.note);

    const targetSpendCondition = buildSinglePkhSpendCondition(targetV1Pkh);
    const refundLock = wasm.lockHash(targetSpendCondition);
    const builder = new wasm.TxBuilder(options.txEngineSettings);
    appendV0MigrationSpends(
      builder,
      notesToUse,
      notesToUse.map(() => null),
      refundLock
    );

    builder.recalcAndSetFee(false);
    const feeNicks = builder.curFee();
    const transaction = builder.build();
    const rawTx: RawTxV1 = wasm.nockchainTxToRawTx(transaction);

    const inputNotes = notesToUse;
    const feeNock = Number(BigInt(feeNicks)) / NOCK_TO_NICKS;
    const selectedTotal = inputNotes.reduce((sum, note) => sum + BigInt(note.assets), 0n);
    const migratedNicks = (selectedTotal - BigInt(feeNicks)).toString() as Nicks;
    const migratedNock = Number(selectedTotal) / NOCK_TO_NICKS - feeNock;

    const result: BuildV0MigrationTxResult = {
      ...balanceResult,
      txId: transaction.id,
      fee: feeNicks,
      feeNock,
      v0MigrationTxSignPayload: {
        rawTx,
        notes: inputNotes,
        spendConditions: inputNotes.map(() => null),
        refundLock,
      },
      migratedNicks,
      migratedNock,
    };
    return result;
  } catch (e) {
    console.warn('[SDK Migration] Build failed, returning balance only:', e);
    return balanceResult;
  }
}

export type {
  BuildV0MigrationTxOptions,
  BuildV0MigrationTxResult,
  V0BalanceResult,
  V0MigrationTxSignPayload,
} from './migration-types.js';
