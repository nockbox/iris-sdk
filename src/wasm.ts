/**
 * WASM module exports
 */

export * from '@nockbox/iris-wasm/iris_wasm';
export { default } from '@nockbox/iris-wasm/iris_wasm';
export * as guard from '@nockbox/iris-wasm/iris_wasm.guard';

import init from '@nockbox/iris-wasm/iris_wasm';

/**
 * Canonical initializer re-export for SDK consumers.
 * Prefer using this instead of importing iris-wasm directly.
 */
export const initWasm = init;
