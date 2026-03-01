/**
 * WASM module exports
 */
export * from '@nockbox/iris-wasm/iris_wasm.js';
export { default } from '@nockbox/iris-wasm/iris_wasm.js';
import init from '@nockbox/iris-wasm/iris_wasm.js';
/**
 * Canonical initializer re-export for SDK consumers.
 * Prefer using this instead of importing iris-wasm directly.
 */
export const initWasm = init;
//# sourceMappingURL=wasm.js.map