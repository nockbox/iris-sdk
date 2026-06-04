/**
 * Runtime validation for `SignTxRequest` at RPC / postMessage boundaries.
 */

import * as guard from '@nockbox/iris-wasm/iris_wasm.guard';
import type { SignTxRequest } from './types.js';

export function isSignTxRequest(obj: unknown): obj is SignTxRequest {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as { tx?: unknown; notes?: unknown };
  return (
    guard.isNockchainTx(p.tx) &&
    (typeof p.notes === 'undefined' ||
      (Array.isArray(p.notes) && p.notes.every((note: unknown) => guard.isNote(note))))
  );
}
