import type { BuildV0MigrationFromMnemonicResult, BuildV0MigrationTransactionResult, BuildV0MigrationSingleNoteResult, DerivedV0Address, QueryV0BalanceFromMnemonicResult, QueryV0BalanceResult } from './migration-types.js';
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
 * Tries master key first; if no Legacy notes found, retries with child index 0
 * (some v0 wallets used child derivation).
 */
export declare function queryV0BalanceFromMnemonic(mnemonic: string, grpcEndpoint: string, passphrase?: string, childIndex?: number): Promise<QueryV0BalanceFromMnemonicResult>;
/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 *
 * @param options.singleNoteOnly - [TEMPORARY] When true, uses single-note logic for testing.
 * @param options.debug - [TEMPORARY] When true, logs the built result to console.
 */
export declare function buildV0MigrationTransaction(v0Notes: NoteV0[], targetV1Pkh: string, feePerWord?: Nicks, includeLockData?: boolean, settings?: Partial<TxEngineSettings>, options?: {
    singleNoteOnly?: boolean;
    debug?: boolean;
}): Promise<BuildV0MigrationTransactionResult | BuildV0MigrationSingleNoteResult>;
/**
 * Derive v0 address, query legacy notes, and build migration transaction in one step.
 *
 * @param options.singleNoteOnly - [TEMPORARY] When true, migrates 200 NOCK from one note.
 * @param options.debug - [TEMPORARY] When true, logs the built result to console.
 */
export declare function buildV0MigrationFromMnemonic(mnemonic: string, grpcEndpoint: string, targetV1Pkh: string, passphrase?: string, childIndex?: number, feePerWord?: Nicks, includeLockData?: boolean, settings?: Partial<TxEngineSettings>, options?: {
    singleNoteOnly?: boolean;
    debug?: boolean;
}): Promise<BuildV0MigrationFromMnemonicResult>;
/**
 * Build migration from protobuf notes (matches extension API).
 * Caller must have initialized WASM before using.
 */
export declare function buildV0MigrationTransactionFromNotes(v0NotesProtobuf: unknown[], targetV1Pkh: string, feePerWord?: Nicks, options?: {
    debug?: boolean;
}): Promise<BuildV0MigrationSingleNoteResult>;
export type { BuildV0MigrationFromMnemonicResult, BuildV0MigrationTransactionResult, BuildV0MigrationSingleNoteResult, DerivedV0Address, QueryV0BalanceFromMnemonicResult, QueryV0BalanceResult, } from './migration-types.js';
//# sourceMappingURL=migration.d.ts.map