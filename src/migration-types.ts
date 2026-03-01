/**
 * Types for querying v0 balance and building v0 -> v1 migration transactions.
 * Aligned with @nockbox/iris-wasm (Nicks, NockchainTx, NoteV0, RawTx, SpendCondition).
 */
import type {
  NockchainTx,
  Nicks,
  NoteV0,
  PbCom2Balance,
  RawTx,
  SpendCondition,
} from '@nockbox/iris-wasm/iris_wasm.js';

export type { Nicks };

/** Input required to query legacy (v0) notes for a seed-derived PKH. */
export interface QueryV0BalanceParams {
  /** gRPC endpoint to query notes from. */
  grpcEndpoint: string;
  /** PKH derived from the user's seedphrase. */
  sourcePkh: string;
}

/** Result of querying v0 balance via first-name lookup. */
export interface QueryV0BalanceResult {
  /** Optional first-name digest (not required when querying by address). */
  firstName?: string;
  /** Raw balance payload from gRPC. */
  balance: PbCom2Balance;
  /** Parsed v0 notes found in the balance response. */
  v0Notes: NoteV0[];
}

/** Input for building a migration transaction from v0 notes to a v1 PKH address. */
export interface BuildV0MigrationTransactionParams {
  /** Legacy notes to migrate (typically from queryV0BalanceForPkh). */
  v0Notes: NoteV0[];
  /** Destination v1 PKH (usually the extension wallet PKH). */
  targetV1Pkh: string;
  /** Fee-per-word used by TxBuilder (WASM Nicks = string, e.g. "32768"). */
  feePerWord?: Nicks;
  /** Whether to include lock metadata in refund/migration seeds. */
  includeLockData?: boolean;
}

/** Result of building a v0 -> v1 migration transaction. */
export interface BuildV0MigrationTransactionResult {
  /** Built transaction object returned by iris-wasm TxBuilder. */
  transaction: NockchainTx;
  /** Transaction id (normalized as a string). */
  txId: string;
  /** Calculated fee in nicks (WASM Nicks = string). */
  fee: Nicks;
  /** Payload compatible with provider.signRawTx(...) */
  signRawTxPayload: {
    rawTx: RawTx;
    notes: NoteV0[];
    spendConditions: SpendCondition[];
  };
}
