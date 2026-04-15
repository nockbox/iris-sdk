/**
 * Iris Wallet SDK
 * TypeScript SDK for interacting with Iris wallet extension
 */

export * from './types.js';
export * from './provider.js';
export * from './migration.js';
export * from './errors.js';
export * from './constants.js';
export * from './validate-sign-tx-request.js';
export * from './compat.js';
export * from './bridge.js';
export * as wasm from './wasm.js';
export { initWasm } from './wasm.js';
