/**
 * TypeScript type definitions for Iris SDK
 */

import { Nicks, TxEngineSettings, PublicKey, Signature, Digest, NockchainTx, Note } from './wasm';

/**
 * Transaction object representing a Nockchain transaction
 */
export type NicksLike = number | Nicks | bigint;

/**
 * RPC request object for communicating with the extension
 */
export interface RpcRequest<T = unknown> {
  /** The RPC method to call */
  method: string;
  /** API version of this request payload (defaults to legacy API 0 when omitted) */
  api?: string;
  /** Optional parameters for the method */
  params?: T;
  /** Optional timeout for the request */
  timeout?: number;
}

/**
 * RPC response object from the extension
 */
export interface RpcResponse<T = unknown> {
  /** The result of the RPC call */
  result?: T;
  /** Error information if the call failed */
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface ConnectRequest {
  /** @deprecated API version now lives on RpcRequest.api */
  api?: string;
}

export interface RpcConfig {
  rpcUrl: string;
  networkName: string;
  blockExplorerUrl: string;
  txEngineActivationHeights: Record<number, TxEngineSettings>;
  coinbaseTimelockBlocks: number;
}

export interface ConnectResponse {
  account: Account;
  rpcConfig: RpcConfig;
}

export interface V0Account {
  type: 'v0';
  address: PublicKey;
}

export interface V1Account {
  type: 'v1';
  address: Digest;
}

export type Account = V0Account | V1Account;
export type Address = PublicKey | Digest;

export interface SignMessageRequest {
  message: string;
}

export interface SignMessageResponse {
  signature: Signature;
  /** Base58 encoded public key */
  publicKey: PublicKey;
}

export interface SendTransactionRequest {
  /** Recipient address (base58-encoded public key hash / PKH) */
  to: Address;
  /** Amount to send in nicks (legacy number + canonical string/bigint accepted) */
  amount: Nicks;
  /**
   * Transaction fee in nicks (legacy number + canonical string/bigint accepted).
   * Optional: when omitted, the wallet estimates the fee, shows it in the approval
   * popup, and auto-calculates the exact fee at build time. The send response
   * reports the actual fee used.
   */
  fee?: Nicks;
}

export interface EstimateTransactionFeeRequest {
  /** Recipient address (base58-encoded public key hash / PKH) */
  to: Address;
  /** Amount to send in nicks (legacy number + canonical string/bigint accepted) */
  amount: Nicks;
}

export interface EstimateTransactionFeeResponse {
  /** Estimated fee in nicks (canonical string) */
  fee: Nicks;
}

export interface SignTxRequest {
  tx: NockchainTx;
  /**
   * Optional untrusted sidecar notes retained for API 0 wallet compatibility.
   *
   * Wallets MUST NOT use these notes as the authoritative approval display or
   * assume they describe `tx`. Review data must be derived from `tx` and, where
   * available, independently matched to wallet-owned state.
   */
  notes?: Note[];
}

export interface SignTxResponse {
  tx: NockchainTx;
}

/**
 * Event types that the provider can emit
 */
export type NockchainEvent = 'accountsChanged' | 'chainChanged' | 'connect' | 'disconnect';

/**
 * Event listener callback function
 */
export type EventListener<T = unknown> = (data: T) => void;

/**
 * Interface for the injected window.nockchain object
 */
export interface InjectedNockchain {
  /**
   * Make an RPC request to the wallet extension
   * @param request - The RPC request object
   * @returns Promise resolving to the result
   */
  request<Req = unknown, Res = unknown>(request: RpcRequest<Req>): Promise<Res>;

  /**
   * Provider name (e.g., 'iris')
   */
  provider?: string;

  /**
   * Provider version
   */
  version?: string;

  /**
   * Supported RPC API version
   */
  api?: string;
}

/**
 * Extended Window interface with nockchain property
 */
declare global {
  interface Window {
    nockchain?: InjectedNockchain;
  }
}

/**
 * Chain information
 */
export interface ChainInfo {
  /** Chain ID (e.g., 'mainnet', 'testnet') */
  chainId: string;
  /** Network name */
  name: string;
}

/**
 * Account information
 */
export interface AccountInfo {
  /** Account address */
  address: string;
  /** Account balance in nicks (optional, may not be available) */
  balance?: number;
}
