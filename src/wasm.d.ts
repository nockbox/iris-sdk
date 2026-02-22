/**
 * Type declarations for @nockbox/iris-sdk/wasm module
 * Re-exports all types from iris-wasm
 */

/// <reference types="@nockbox/iris-wasm" />

declare module '@nockbox/iris-sdk/wasm' {
  export * from '@nockbox/iris-wasm/iris_wasm';
  import init from '@nockbox/iris-wasm/iris_wasm';
  export default init;
}
