/**
 * Bridge utilities for Nockchain ↔ EVM bridging.
 * Encoding uses the Goldilocks prime field (3 belts) for EVM addresses.
 * Consumers provide BridgeConfig; the SDK handles transaction construction and validation.
 */
import type { BridgeConfig, BridgeTransactionParams, BridgeTransactionResult, BridgeValidationResult } from './bridge-types.js';
export declare const GOLDILOCKS_PRIME: bigint;
/** Simple EVM address check (0x + 40 hex chars). No checksum validation. */
export declare function isEvmAddress(address: string): boolean;
/**
 * Convert an EVM address to 3 belts (Goldilocks field elements).
 */
export declare function evmAddressToBelts(address: string): [bigint, bigint, bigint];
/**
 * Convert 3 belts back to an EVM address.
 */
export declare function beltsToEvmAddress(belt1: bigint, belt2: bigint, belt3: bigint): string;
/** Encode a string as a Hoon cord (little-endian hex). */
export declare function stringToAtom(str: string): string;
/** Encode a bigint as hex (no 0x prefix). */
export declare function bigintToAtom(n: bigint): string;
/**
 * Build the bridge noun structure for an EVM address.
 * Structure: [versionTag [chainTag [belt1 [belt2 belt3]]]]
 */
export declare function buildBridgeNoun(evmAddress: string, config: Pick<BridgeConfig, 'chainTag' | 'versionTag'>): unknown;
/**
 * Verify belt encoding round-trips correctly.
 */
export declare function verifyBeltEncoding(address: string): boolean;
/**
 * Check if a bridge config is valid and usable.
 */
export declare function isBridgeConfigured(config: BridgeConfig): boolean;
/**
 * Create jammed bridge note data for an EVM address (requires WASM).
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export declare function createBridgeNoteData(evmAddress: string, config: BridgeConfig): Promise<Uint8Array>;
/**
 * Build a bridge transaction (requires WASM).
 * Consumer supplies notes and spend conditions; SDK builds the tx from config.
 */
export declare function buildBridgeTransaction(params: BridgeTransactionParams, config: BridgeConfig): Promise<BridgeTransactionResult>;
/**
 * Validate a bridge transaction (pre- or post-signing).
 * Uses config for note key, min amount, and optional lock root.
 */
export declare function validateBridgeTransaction(rawTxProto: unknown, config: BridgeConfig): Promise<BridgeValidationResult>;
/**
 * Validate and throw if invalid (convenience wrapper).
 */
export declare function assertValidBridgeTransaction(rawTxProto: unknown, context: 'pre-signing' | 'post-signing', config: BridgeConfig): Promise<BridgeValidationResult>;
export type { BridgeConfig, BridgeTransactionParams, BridgeTransactionResult, BridgeValidationResult, } from './bridge-types.js';
//# sourceMappingURL=bridge.d.ts.map