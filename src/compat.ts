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
import * as guard from '@nockbox/iris-wasm/iris_wasm.guard';

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

/** Protobuf signRawTx payload (gRPC wire format). */
export interface LegacySignRawTxRequest {
  rawTx: PbCom2RawTransaction;
  notes: PbCom2Note[];
  spendConditions: PbCom2SpendCondition[];
}

/** Native signRawTx payload. */
export interface SignRawTxRequest {
  rawTx: RawTx;
  notes: Note[];
  spendConditions: SpendCondition[];
}

/** SignRawTx params: native or protobuf. */
export type SignRawTxParams = SignRawTxRequest | LegacySignRawTxRequest;

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

function toProtobufIfNeeded(v: unknown): unknown {
  if (
    v &&
    typeof v === 'object' &&
    typeof (v as { toProtobuf?: () => unknown }).toProtobuf === 'function'
  ) {
    return (v as { toProtobuf: () => unknown }).toProtobuf();
  }
  return v;
}

/**
 * Validate signRawTx params. Accepts all-native or all-protobuf (no mixing).
 */
export function normalizeSignRawTxParams(params: {
  rawTx: unknown;
  notes: unknown[];
  spendConditions: unknown[];
}): SignRawTxParams {
  const rawTx = toProtobufIfNeeded(params.rawTx);
  const notes = params.notes.map(toProtobufIfNeeded);
  const spendConditions = params.spendConditions.map(toProtobufIfNeeded);

  if (
    !Array.isArray(notes) ||
    notes.length === 0 ||
    !Array.isArray(spendConditions) ||
    spendConditions.length === 0
  ) {
    throw new Error('Invalid signRawTx params: notes and spendConditions must be non-empty arrays');
  }

  const rawTxNative = guard.isRawTx(rawTx);
  const rawTxProtobuf = guard.isPbCom2RawTransaction(rawTx);
  const allNotesNative = notes.every(n => guard.isNote(n));
  const allNotesProtobuf = notes.every(n => guard.isPbCom2Note(n));
  const allScNative = spendConditions.every(sc => guard.isSpendCondition(sc));
  const allScProtobuf = spendConditions.every(sc => guard.isPbCom2SpendCondition(sc));

  const validNative = rawTxNative && allNotesNative && allScNative;
  const validProtobuf = rawTxProtobuf && allNotesProtobuf && allScProtobuf;

  if (!validNative && !validProtobuf) {
    throw new Error(
      'Invalid signRawTx params: expected all-native (RawTx, Note[], SpendCondition[]) or all-protobuf (PbCom2*), no mixing'
    );
  }

  return { rawTx, notes, spendConditions } as SignRawTxParams;
}
