/**
 * Backward-compatibility helpers for SDK request payloads.
 * Accepts legacy numeric forms and normalizes to canonical Nicks strings.
 */

import type { Transaction, NicksLike } from './types.js';

/**
 * Canonical transaction payload expected by migrated wallets.
 */
export interface CanonicalTransaction {
  to: string;
  amount: string;
  fee?: string;
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
 * Normalize SDK transaction input into canonical payload:
 * - amount/fee become integer strings (Nicks)
 * - optional fee remains optional
 */
export function normalizeTransaction(transaction: Transaction): CanonicalTransaction {
  const amount = parseNicksLike(transaction.amount, 'amount');
  const fee = transaction.fee === undefined ? undefined : parseNicksLike(transaction.fee, 'fee');

  return {
    to: transaction.to,
    amount,
    ...(fee !== undefined ? { fee } : {}),
  };
}

