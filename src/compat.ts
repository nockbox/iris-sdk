/**
 * Backward-compatibility helpers for SDK request payloads.
 */

import type { Transaction, NicksLike } from './types.js';
import type {
  PbCom2RawTransaction,
  PbCom2Note,
  PbCom2SpendCondition,
  RawTx,
  Note,
  SpendCondition,
} from '@nockbox/iris-wasm/iris_wasm.js';
import * as guard from './iris_wasm.guard.js';

/** Simple send payload: to, amount, fee as nicks strings (for sendTransaction). */
export interface CanonicalSendPayload {
  to: string;
  amount: string;
  fee?: string;
}

/**
 * Normalize simple send input: amount/fee to nicks strings.
 */
export function normalizeSendTransaction(transaction: Transaction): CanonicalSendPayload {
  const amount = parseNicksLike(transaction.amount, 'amount');
  const fee = transaction.fee === undefined ? undefined : parseNicksLike(transaction.fee, 'fee');

  return {
    to: transaction.to,
    amount,
    ...(fee !== undefined ? { fee } : {}),
  };
}

/** Protobuf signRawTx payload (gRPC wire format). Only format supported at API boundary. */
export interface LegacySignRawTxRequest {
  /** Raw transaction protobuf */
  rawTx: PbCom2RawTransaction;
  /** Input notes (protobuf) */
  notes: PbCom2Note[];
  /** Spend conditions (protobuf) */
  spendConditions: PbCom2SpendCondition[];
}

/** Params for signRawTx. Protobuf only for now (native RawTx not supported at RPC boundary. */
export type SignRawTxParams = LegacySignRawTxRequest;

/** Native signRawTx payload (RawTx, Note[], SpendCondition[]). Used internally after protobuf conversion. */
export interface NativeSignRawTxRequest {
  /** Raw transaction (native) */
  rawTx: RawTx;
  /** Input notes (native) */
  notes: Note[];
  /** Spend conditions (native) */
  spendConditions: SpendCondition[];
}

/** Type guard: validates protobuf signRawTx payload. Use at API boundary (SDK + extension). */
export function isLegacySignRawTxRequest(obj: unknown): obj is LegacySignRawTxRequest {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as { rawTx?: unknown; notes?: unknown; spendConditions?: unknown };
  return (
    guard.isPbCom2RawTransaction(p.rawTx) &&
    Array.isArray(p.notes) &&
    p.notes.length > 0 &&
    p.notes.every((n: unknown) => guard.isPbCom2Note(n)) &&
    Array.isArray(p.spendConditions) &&
    p.spendConditions.length > 0 &&
    p.spendConditions.every((sc: unknown) => guard.isPbCom2SpendCondition(sc))
  );
}

/** Type guard: validates native signRawTx payload. Use internally after protobuf→native conversion. */
export function isNativeSignRawTxPayload(obj: unknown): obj is NativeSignRawTxRequest {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as { rawTx?: unknown; notes?: unknown; spendConditions?: unknown };
  return (
    guard.isRawTx(p.rawTx) &&
    Array.isArray(p.notes) &&
    p.notes.length > 0 &&
    p.notes.every((n: unknown) => guard.isNote(n)) &&
    Array.isArray(p.spendConditions) &&
    p.spendConditions.length > 0 &&
    p.spendConditions.every((sc: unknown) => guard.isSpendCondition(sc))
  );
}

function assertIntegerString(value: string, field: 'amount' | 'fee'): string {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(`Invalid ${field}: expected an integer-like value`);
  }
  return trimmed;
}

/**
 * Parse legacy number/bigint/string nicks into canonical string format.
 */
export function parseNicksLike(value: NicksLike, field: 'amount' | 'fee'): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value) || !Number.isInteger(value)) {
      throw new Error(`Invalid ${field}: expected a finite integer number`);
    }
    return String(value);
  }

  if (typeof value === 'string') {
    return assertIntegerString(value, field);
  }

  throw new Error(`Invalid ${field}: unsupported value type`);
}

/**
 * Validate signRawTx params. Input must be protobuf (LegacySignRawTxRequest).
 * RPC sends only LegacySignRawTxRequest. Native (SignRawTxRequest) not supported.
 */
export function normalizeSignRawTxParams(params: SignRawTxParams): SignRawTxParams {
  if (!isLegacySignRawTxRequest(params)) {
    throw new Error(
      'Invalid signRawTx params: expected protobuf (PbCom2RawTransaction, PbCom2Note[], PbCom2SpendCondition[])'
    );
  }
  return params;
}
