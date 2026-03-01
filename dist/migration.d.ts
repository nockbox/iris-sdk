import type { BuildV0MigrationTransactionParams, BuildV0MigrationTransactionResult, QueryV0BalanceParams, QueryV0BalanceResult } from './migration-types.js';
/**
 * Query address balance and return only v0 (Legacy) notes.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export declare function queryV0BalanceForPkh(params: QueryV0BalanceParams): Promise<QueryV0BalanceResult>;
/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export declare function buildV0MigrationTransaction(params: BuildV0MigrationTransactionParams): Promise<BuildV0MigrationTransactionResult>;
export type { BuildV0MigrationTransactionParams, BuildV0MigrationTransactionResult, QueryV0BalanceParams, QueryV0BalanceResult, } from './migration-types.js';
//# sourceMappingURL=migration.d.ts.map