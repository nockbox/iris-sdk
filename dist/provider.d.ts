/**
 * NockchainProvider - Main SDK class for interacting with Iris wallet
 */
import type { Transaction, NockchainEvent, EventListener } from './types.js';
import { TransactionBuilder } from './transaction.js';
/**
 * NockchainProvider class - Main interface for dApps to interact with Iris wallet
 *
 * @example
 * ```typescript
 * const nockchain = new NockchainProvider();
 *
 * // Connect wallet
 * const accounts = await nockchain.requestAccounts();
 *
 * // Build and send transaction
 * const tx = nockchain.transaction()
 *   .to('recipient_address')
 *   .amount(1_000_000)
 *   .build();
 *
 * const txId = await nockchain.sendTransaction(tx);
 * ```
 */
export declare class NockchainProvider {
    private injected;
    private eventListeners;
    private _accounts;
    private _chainId;
    private _messageHandler?;
    /**
     * Create a new NockchainProvider instance
     * @throws {WalletNotInstalledError} If the Iris extension is not installed
     */
    constructor();
    /**
     * Connect to the wallet and request access
     * This will prompt the user to approve the connection
     * @returns Promise resolving to wallet info with PKH and gRPC endpoint
     * @throws {UserRejectedError} If the user rejects the request
     * @throws {RpcError} If the RPC call fails
     */
    connect(): Promise<{
        pkh: string;
        grpcEndpoint: string;
    }>;
    /**
     * Get the currently connected accounts (if any)
     * @returns Array of connected account addresses (PKH)
     */
    get accounts(): string[];
    /**
     * Get the current chain ID
     * @returns The current chain ID or null if not connected
     */
    get chainId(): string | null;
    /**
     * Check if the wallet is connected
     * @returns true if wallet is connected
     */
    get isConnected(): boolean;
    /**
     * Send a transaction
     * @param transaction - The transaction object to send
     * @returns Promise resolving to the transaction ID
     * @throws {NoAccountError} If no account is connected
     * @throws {UserRejectedError} If the user rejects the transaction
     * @throws {RpcError} If the RPC call fails
     */
    sendTransaction(transaction: Transaction): Promise<string>;
    /**
     * Sign an arbitrary message with the current account
     * @param message - The message to sign
     * @returns Promise resolving to the signature and public key hex (for verification)
     * @throws {NoAccountError} If no account is connected
     * @throws {UserRejectedError} If the user rejects the signing request
     * @throws {RpcError} If the RPC call fails
     */
    signMessage(message: string): Promise<{
        signature: string;
        publicKeyHex: string;
    }>;
    /**
     * Sign a raw transaction
     * Accepts either wasm objects (with toProtobuf() method) or protobuf JS objects
     * @param params - The transaction parameters (rawTx, notes, spendConditions)
     * @returns Promise resolving to the signed raw transaction as protobuf Uint8Array
     * @throws {NoAccountError} If no account is connected
     * @throws {UserRejectedError} If the user rejects the signing request
     * @throws {RpcError} If the RPC call fails
     *
     * @example
     * ```typescript
     * // Option 1: Pass wasm objects directly (auto-converts to protobuf)
     * const rawTx = builder.build();
     * const txNotes = builder.allNotes();
     *
     * const signedTx = await provider.signRawTx({
     *   rawTx: rawTx,  // wasm RawTx object
     *   notes: txNotes.notes,  // array of wasm Note objects
     *   spendConditions: txNotes.spendConditions  // array of wasm SpendCondition objects
     * });
     *
     * // Option 2: Pass protobuf JS objects directly
     * const signedTx = await provider.signRawTx({
     *   rawTx: rawTxProtobufObject,  // protobuf JS object
     *   notes: noteProtobufObjects,  // array of protobuf JS objects
     *   spendConditions: spendCondProtobufObjects  // array of protobuf JS objects
     * });
     * ```
     */
    signRawTx(params: {
        rawTx: any;
        notes: any[];
        spendConditions: any[];
    }): Promise<Uint8Array>;
    /**
     * Create a new transaction builder
     * @returns A new TransactionBuilder instance
     *
     * @example
     * ```typescript
     * const tx = provider.transaction()
     *   .to('recipient_address')
     *   .amount(1_000_000)
     *   .fee(50_000)
     *   .build();
     * ```
     */
    transaction(): TransactionBuilder;
    /**
     * Add an event listener for wallet events
     * @param event - The event to listen for
     * @param listener - The callback function to invoke when the event occurs
     *
     * @example
     * ```typescript
     * provider.on('accountsChanged', (accounts) => {
     *   console.log('Accounts changed:', accounts);
     * });
     * ```
     */
    on<T = unknown>(event: NockchainEvent, listener: EventListener<T>): void;
    /**
     * Remove an event listener
     * @param event - The event to stop listening for
     * @param listener - The callback function to remove
     */
    off<T = unknown>(event: NockchainEvent, listener: EventListener<T>): void;
    /**
     * Remove all event listeners for a specific event or all events
     * @param event - Optional event to remove listeners for (removes all if not specified)
     */
    removeAllListeners(event?: NockchainEvent): void;
    /**
     * Make a raw RPC request to the wallet extension (EIP-1193 compatible)
     * @param args - The RPC request arguments
     * @returns Promise resolving to the result
     * @throws {UserRejectedError} If the user rejects the request
     * @throws {RpcError} If the RPC call fails
     */
    request<T = unknown>(args: {
        method: string;
        params?: unknown[];
    }): Promise<T>;
    /**
     * Check if an error represents user rejection
     * Uses EIP-1193 standard error code 4001
     */
    private isUserRejected;
    /**
     * Set up event listeners for wallet events
     * This listens for events from the extension and forwards them to registered listeners
     */
    private setupEventListeners;
    /**
     * Clean up event listeners and resources
     * Call this when the provider is no longer needed (e.g., on component unmount)
     */
    dispose(): void;
    /**
     * Emit an event to all registered listeners
     * @param event - The event to emit
     * @param data - The data to pass to listeners
     */
    private emit;
    /**
     * Check if the Iris extension is installed and authentic
     * @returns true if the extension is installed
     */
    static isInstalled(): boolean;
}
//# sourceMappingURL=provider.d.ts.map