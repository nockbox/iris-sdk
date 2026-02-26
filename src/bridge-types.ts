/**
 * Bridge configuration and transaction types for the SDK.
 * Consumers (nockswap, extension) provide BridgeConfig; the SDK handles tx construction and validation.
 */

import type { NockchainTx, Nicks, Note, SpendCondition } from '@nockbox/iris-wasm/iris_wasm.js';

export type { Nicks };

/**
 * Configuration for a specific bridge (e.g. Zorp Nock→Base).
 * Pass this to all bridge functions so the SDK can build/validate transactions without hardcoded constants.
 */
export interface BridgeConfig {
  /** Multisig threshold (e.g. 3 for 3-of-5) */
  threshold: number;
  /** Multisig PKH addresses (Nockchain addresses) */
  addresses: string[];
  /** Note data key used for bridge payload (e.g. "bridge") */
  noteDataKey: string;
  /** Chain identifier in note data, hex string (e.g. "65736162" for %base) */
  chainTag: string;
  /** Version tag in note data (e.g. "0") */
  versionTag: string;
  /** Fee per word in nicks (WASM Nicks = string, e.g. "32768") */
  feePerWord: Nicks;
  /** Minimum amount in nicks for a valid bridge output (for validation) */
  minAmountNicks: Nicks;
  /** Optional: expected lock root hash for bridge output (if set, validation checks it) */
  expectedLockRoot?: string;
}

/**
 * Parameters for building a bridge transaction.
 * Input notes and spend conditions are supplied by the consumer (e.g. from gRPC).
 */
export interface BridgeTransactionParams {
  /** User's input notes (UTXOs to spend) */
  inputNotes: Note[];
  /** Spend conditions for each input note */
  spendConditions: SpendCondition[];
  /** Amount to bridge in nicks (WASM Nicks = string) */
  amountInNicks: Nicks;
  /** Destination EVM address on the target chain */
  destinationAddress: string;
  /** User's PKH for refunds/change */
  refundPkh: string;
  /** Optional fee override in nicks */
  feeOverride?: Nicks;
}

/**
 * Result of building a bridge transaction (unsigned).
 */
export interface BridgeTransactionResult {
  /** The built transaction (ready for signing) */
  transaction: NockchainTx;
  /** Transaction ID */
  txId: string;
  /** Calculated fee in nicks (WASM Nicks = string) */
  fee: Nicks;
}

/**
 * Result of validating a bridge transaction (pre- or post-signing).
 */
export interface BridgeValidationResult {
  valid: boolean;
  error?: string;
  /** Amount being sent to bridge in nicks */
  bridgeAmountNicks?: Nicks;
  /** Destination EVM address extracted from note data */
  destinationAddress?: string;
  /** Belt encoding extracted from note data */
  belts?: [bigint, bigint, bigint];
  /** Note data key */
  noteDataKey?: string;
  /** Bridge version */
  version?: string;
  /** Chain identifier */
  chain?: string;
}
