/**
 * Transaction builder with fluent API for constructing Nockchain transactions
 */
import type { Transaction } from './types.js';
/**
 * Conversion rate: 1 NOCK = 65,536 nicks (2^16)
 */
export declare const NOCK_TO_NICKS = 65536;
/**
 * Default transaction fee in nicks (32,768 nicks = 0.5 NOCK)
 */
export declare const DEFAULT_FEE = 32768;
/**
 * Minimum amount in nicks (must be positive)
 */
export declare const MIN_AMOUNT = 1;
/**
 * TransactionBuilder class implementing the builder pattern for type-safe transaction construction
 *
 * @example
 * ```typescript
 * const tx = new TransactionBuilder()
 *   .to('nock1recipient_address')
 *   .amount(1_000_000)
 *   .fee(50_000)
 *   .build();
 * ```
 */
export declare class TransactionBuilder {
    private _to?;
    private _amount?;
    private _fee?;
    /**
     * Set the recipient address for the transaction
     * @param address - Base58-encoded Nockchain V1 PKH address (40 bytes, ~54-55 chars)
     * @returns A new TransactionBuilder instance with the address set
     * @throws {InvalidAddressError} If the address format is invalid
     */
    to(address: string): TransactionBuilder;
    /**
     * Set the amount to send in nicks (1 NOCK = 65,536 nicks)
     * @param nicks - Amount in nicks (must be a positive integer)
     * @returns A new TransactionBuilder instance with the amount set
     * @throws {InvalidTransactionError} If the amount is invalid
     */
    amount(nicks: number): TransactionBuilder;
    /**
     * Set the transaction fee in nicks (optional, defaults to 32,768 nicks)
     * @param nicks - Fee amount in nicks (must be a positive integer)
     * @returns A new TransactionBuilder instance with the fee set
     * @throws {InvalidTransactionError} If the fee is invalid
     */
    fee(nicks: number): TransactionBuilder;
    /**
     * Build and validate the transaction
     * @returns The constructed Transaction object
     * @throws {InvalidTransactionError} If required fields are missing
     */
    build(): Transaction;
    /**
     * Validate a Nockchain V1 PKH address format
     * V1 PKH addresses are TIP5 hash (40 bytes) of public key, base58-encoded
     *
     * Validates by decoding the base58 string and checking for exactly 40 bytes
     * rather than relying on character count which can vary
     *
     * @param address - The address to validate
     * @returns true if valid, false otherwise
     */
    private isValidAddress;
    /**
     * Create a transaction builder from an existing transaction object
     * Useful for modifying existing transactions
     * @param tx - The transaction to create a builder from
     * @returns A new TransactionBuilder instance with values from the transaction
     * @throws {InvalidAddressError} If the transaction address is invalid
     * @throws {InvalidTransactionError} If the transaction amount or fee is invalid
     */
    static fromTransaction(tx: Transaction): TransactionBuilder;
}
//# sourceMappingURL=transaction.d.ts.map