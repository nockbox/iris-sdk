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
/**
 * Parse legacy number/bigint/string nicks into canonical string format.
 */
export declare function parseNicksLike(value: NicksLike, field: 'amount' | 'fee'): string;
/**
 * Normalize SDK transaction input into canonical payload:
 * - amount/fee become integer strings (Nicks)
 * - optional fee remains optional
 */
export declare function normalizeTransaction(transaction: Transaction): CanonicalTransaction;
//# sourceMappingURL=compat.d.ts.map