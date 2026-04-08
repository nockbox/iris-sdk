/**
 * Types for querying v0 balance and building v0 -> v1 migration transactions.
 * Aligned with @nockbox/iris-wasm (Nicks, NoteV0, RawTx, SpendCondition).
 */
import type {
  LockRoot,
  Nicks,
  NoteV0,
  PbCom2Balance,
  RawTx,
  SpendCondition,
} from '@nockbox/iris-wasm/iris_wasm.js';

export type { Nicks };

/** Result of querying v0 balance. Use this to construct a migration transaction. */
export interface V0BalanceResult {
  sourceAddress: string;
  balance: PbCom2Balance;
  v0Notes: NoteV0[];
  totalNicks: Nicks;
  totalNock: number;
  smallestNoteNock?: number;
  rawNotesFromRpc?: number;
}

/** buildV0MigrationTx result: balance fields always present; tx fields when target provided and build succeeded. */
export interface BuildV0MigrationTxResult {
  sourceAddress: string;
  balance: PbCom2Balance;
  v0Notes: NoteV0[];
  totalNicks: Nicks;
  totalNock: number;
  smallestNoteNock?: number;
  rawNotesFromRpc?: number;
  txId?: string;
  fee?: Nicks;
  feeNock?: number;
  signRawTxPayload?: {
    rawTx: RawTx;
    notes: NoteV0[];
    spendConditions: (SpendCondition | null)[];
    refundLock: LockRoot;
  };
  migratedNicks?: Nicks;
  migratedNock?: number;
}
