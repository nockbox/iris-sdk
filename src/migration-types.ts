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

/** Legacy address metadata derived from mnemonic. */
export interface DerivedV0Address {
  /** Base58 bare public key (legacy address form). */
  sourceAddress: string;
}

/** Result of querying v0 balance. */
export interface QueryV0BalanceResult {
  balance: PbCom2Balance;
  v0Notes: NoteV0[];
  totalNicks: Nicks;
}

/** Result of mnemonic-based v0 discovery (derived address + balance). */
export interface QueryV0BalanceFromMnemonicResult
  extends QueryV0BalanceResult,
    DerivedV0Address {}

/** Result of building a migration transaction. */
export interface BuildV0MigrationTransactionResult {
  transaction: NockchainTx;
  txId: string;
  fee: Nicks;
  signRawTxPayload: {
    rawTx: RawTx;
    notes: NoteV0[];
    spendConditions: SpendCondition[];
  };
}

/** Result of mnemonic-based migration build. */
export interface BuildV0MigrationFromMnemonicResult
  extends BuildV0MigrationTransactionResult {
  discovery: QueryV0BalanceFromMnemonicResult;
}
