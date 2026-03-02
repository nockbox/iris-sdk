import type { BuildV0MigrationFromMnemonicParams, BuildV0MigrationFromMnemonicResult, BuildV0MigrationTransactionParams, BuildV0MigrationTransactionResult, DeriveV0AddressParams, DerivedV0Address, QueryV0BalanceParams, QueryV0BalanceFromMnemonicParams, QueryV0BalanceFromMnemonicResult, QueryV0BalanceResult } from './migration-types.js';
/**
 * Derive legacy v0 address metadata from mnemonic.
 *
 * v0 discovery queries use the base58-encoded bare public key ("sourceAddress").
 * We also expose the hashed PKH digest for callers that need lock condition metadata.
 */
export declare function deriveV0AddressFromMnemonic(params: DeriveV0AddressParams): DerivedV0Address;
/**
 * Query address balance and return only v0 (Legacy) notes.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export declare function queryV0BalanceForAddress(params: QueryV0BalanceParams): Promise<QueryV0BalanceResult>;
/**
 * Back-compat alias kept for older callers.
 * Despite the name, this resolves to address-based lookup via getBalanceByAddress.
 */
export declare function queryV0BalanceForPkh(params: QueryV0BalanceParams): Promise<QueryV0BalanceResult>;
/**
 * Derive v0 discovery address from mnemonic and query legacy notes in one step.
 */
export declare function queryV0BalanceFromMnemonic(params: QueryV0BalanceFromMnemonicParams): Promise<QueryV0BalanceFromMnemonicResult>;
/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export declare function buildV0MigrationTransaction(params: BuildV0MigrationTransactionParams): Promise<BuildV0MigrationTransactionResult>;
/**
 * Derive v0 address, query legacy notes, and build migration transaction.
 */
export declare function buildV0MigrationFromMnemonic(params: BuildV0MigrationFromMnemonicParams): Promise<BuildV0MigrationFromMnemonicResult>;
export type { BuildV0MigrationFromMnemonicParams, BuildV0MigrationFromMnemonicResult, BuildV0MigrationTransactionParams, BuildV0MigrationTransactionResult, DeriveV0AddressParams, DerivedV0Address, QueryV0BalanceParams, QueryV0BalanceFromMnemonicParams, QueryV0BalanceFromMnemonicResult, QueryV0BalanceResult, } from './migration-types.js';
//# sourceMappingURL=migration.d.ts.map