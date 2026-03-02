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

/** Input required to derive the legacy (v0) address from seedphrase. */
export interface DeriveV0AddressParams {
  /** BIP-39 mnemonic for the legacy wallet. */
  mnemonic: string;
  /** Optional BIP-39 passphrase. */
  passphrase?: string;
  /**
   * Optional child derivation index.
   * If omitted, the master key public key is used.
   */
  childIndex?: number;
}

/** Derived legacy address metadata used for v0 discovery. */
export interface DerivedV0Address {
  /** Base58-encoded bare public key (legacy address form used by v0 notes). */
  sourceAddress: string;
  /** PKH digest for the same public key (base58 digest string). */
  sourcePkh: string;
  /** Public key bytes encoded as hex (debug/inspection helper). */
  publicKeyHex: string;
}

/** Input required to query legacy (v0) notes by address. */
export interface QueryV0BalanceParams {
  /** gRPC endpoint to query notes from. */
  grpcEndpoint: string;
  /**
   * Legacy base58 address (bare pubkey).
   * Preferred field.
   */
  sourceAddress?: string;
  /**
   * Back-compat alias. Historically named as PKH, but routed to getBalanceByAddress.
   * If sourceAddress is provided, this field is ignored.
   */
  sourcePkh?: string;
}

/** Result of querying v0 balance via first-name lookup. */
export interface QueryV0BalanceResult {
  /** Optional first-name digest (not required when querying by address). */
  firstName?: string;
  /** Raw balance payload from gRPC. */
  balance: PbCom2Balance;
  /** Parsed v0 notes found in the balance response. */
  v0Notes: NoteV0[];
  /** Sum of v0 note assets in nicks (string for bigint-safe transport). */
  totalNicks: Nicks;
}

/** Input required to derive v0 address and immediately query legacy notes. */
export interface QueryV0BalanceFromMnemonicParams extends DeriveV0AddressParams {
  /** gRPC endpoint to query notes from. */
  grpcEndpoint: string;
}

/** Result of mnemonic-based v0 note discovery. */
export interface QueryV0BalanceFromMnemonicResult extends QueryV0BalanceResult, DerivedV0Address {}

/** Inputs to build a migration transaction directly from mnemonic + destination. */
export interface BuildV0MigrationFromMnemonicParams
  extends QueryV0BalanceFromMnemonicParams,
    Omit<BuildV0MigrationTransactionParams, 'v0Notes'> {}

/** Output of mnemonic-based migration transaction building. */
export interface BuildV0MigrationFromMnemonicResult extends BuildV0MigrationTransactionResult {
  /** Discovery data used to assemble the transaction. */
  discovery: QueryV0BalanceFromMnemonicResult;
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
