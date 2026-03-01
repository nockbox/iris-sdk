/**
 * Custom error classes for Iris SDK
 */
/**
 * Thrown when the Iris wallet extension is not installed
 */
export declare class WalletNotInstalledError extends Error {
    constructor();
}
/**
 * Thrown when the user rejects a transaction or request
 */
export declare class UserRejectedError extends Error {
    constructor(message?: string);
}
/**
 * Thrown when an invalid Nockchain address is provided
 */
export declare class InvalidAddressError extends Error {
    constructor(address: string);
}
/**
 * Thrown when transaction building fails due to missing or invalid fields
 */
export declare class InvalidTransactionError extends Error {
    constructor(message: string);
}
/**
 * Thrown when a method is called that requires an account, but no account is connected
 */
export declare class NoAccountError extends Error {
    constructor();
}
/**
 * Thrown when the RPC request to the extension fails
 */
export declare class RpcError extends Error {
    code: number;
    data?: unknown;
    constructor(code: number, message: string, data?: unknown);
}
//# sourceMappingURL=errors.d.ts.map