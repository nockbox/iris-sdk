import type { BuildV0MigrationFromMnemonicResult, BuildV0MigrationTransactionResult, DerivedV0Address, QueryV0BalanceFromMnemonicResult, QueryV0BalanceResult } from './migration-types.js';
import type { Nicks, NoteV0, TxEngineSettings } from '@nockbox/iris-wasm/iris_wasm.js';
/**
 * Derive legacy v0 address metadata from mnemonic.
 *
 * v0 discovery queries use the base58-encoded bare public key ("sourceAddress").
 */
export declare function deriveV0AddressFromMnemonic(mnemonic: string, passphrase?: string, childIndex?: number): DerivedV0Address;
/**
 * Query address balance and return only v0 (Legacy) notes.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export declare function queryV0BalanceForAddress(grpcEndpoint: string, address: string): Promise<QueryV0BalanceResult>;
/**
 * Derive v0 discovery address from mnemonic and query legacy notes in one step.
 */
export declare function queryV0BalanceFromMnemonic(mnemonic: string, grpcEndpoint: string, passphrase?: string, childIndex?: number): Promise<QueryV0BalanceFromMnemonicResult>;
/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export declare function buildV0MigrationTransaction(v0Notes: NoteV0[], targetV1Pkh: string, feePerWord?: Nicks, includeLockData?: boolean, settings?: Partial<TxEngineSettings>): Promise<BuildV0MigrationTransactionResult>;
/**
 * Derive v0 address, query legacy notes, and build migration transaction in one step.
 */
export declare function buildV0MigrationFromMnemonic(mnemonic: string, grpcEndpoint: string, targetV1Pkh: string, passphrase?: string, childIndex?: number, feePerWord?: Nicks, includeLockData?: boolean, settings?: Partial<TxEngineSettings>): Promise<BuildV0MigrationFromMnemonicResult>;
export type { BuildV0MigrationFromMnemonicResult, BuildV0MigrationTransactionResult, DerivedV0Address, QueryV0BalanceFromMnemonicResult, QueryV0BalanceResult, } from './migration-types.js';
//# sourceMappingURL=migration.d.ts.map