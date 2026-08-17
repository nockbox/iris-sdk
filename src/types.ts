/**
 * TypeScript type definitions for Iris SDK
 */

import { Nicks, TxEngineSettings, PublicKey, Signature, Digest, NockchainTx, Note } from './wasm';

/**
 * SDK-friendly nicks input. Bigints are normalized to canonical strings before
 * crossing the browser-extension RPC boundary.
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

/**
 * Parameters for constructing a simple wallet-funded transaction.
 *
 * Iris selects the inputs and directs change back to the connected account.
 */
export interface BuildSimpleTransactionRequest {
  /** Recipient address (base58-encoded public key hash / PKH) */
  to: Digest;
  /** Amount to send in nicks (legacy number + canonical string or SDK bigint accepted) */
  amount: NicksLike;
  /**
   * Transaction fee in nicks (legacy number + canonical string or SDK bigint accepted).
   * When provided, this is the exact fee the wallet must use. When omitted, the
   * wallet calculates and encodes the fee while building the transaction.
   */
  fee?: NicksLike;
}

export interface SendTransactionRequest {
  /** Recipient address (base58-encoded public key hash / PKH) */
  to: Address;
  /** Amount to send in nicks (legacy number + canonical string or SDK bigint accepted) */
  amount: NicksLike;
  /**
   * Transaction fee in nicks (legacy number + canonical string or SDK bigint accepted).
   * When provided, this is the exact fee the wallet must use. When omitted, the
   * wallet may show an advisory estimate for approval and calculates the actual
   * fee while building the transaction.
   */
  fee?: NicksLike;
}

export interface SendTransactionResponse {
  /** Broadcast transaction ID. */
  txid: string;
  /**
   * Amount sent in canonical nicks. API 1 wallets include this field; it is
   * optional only when an API 1 request is bridged to a legacy API 0 wallet.
   */
  amount?: Nicks;
  /**
   * Actual fee used by the built transaction in canonical nicks. API 1 wallets
   * include this field; it is optional only for legacy API 0 responses.
   */
  fee?: Nicks;
}

/**
 * An unsigned, unreserved snapshot produced from the wallet's current state.
 *
 * `notes` and the summary fields describe this exact transaction snapshot.
 * `outputs` are the wallet's projection at `blockHeight` under the active
 * transaction-engine settings. A wallet must still resolve and revalidate the
 * inputs before signing. Passing these notes back through `signTx` does not
 * make them authoritative.
 */
export interface BuildSimpleTransactionResponse {
  /** Exact unsigned transaction built by the wallet. */
  tx: NockchainTx;
  /** Exact input notes selected for `tx`, in native WASM form. */
  notes: Note[];
  /** Output notes projected at `blockHeight` under the active transaction-engine settings. */
  outputs: Note[];
  /** Witness-independent hash of `tx.spends`, stable across signing. */
  intentId: Digest;
  /** Wallet account used to select inputs and receive change. */
  accountAddress: Digest;
  /** Recipient encoded by this transaction snapshot. */
  to: Digest;
  /** Chain height against which the snapshot was constructed. */
  blockHeight: number;
  /** Recipient amount encoded by the transaction, in canonical nicks. */
  amount: Nicks;
  /** Sum of all selected input notes, in canonical nicks. */
  inputTotal: Nicks;
  /** Actual fee encoded by the transaction, in canonical nicks. */
  fee: Nicks;
  /** Minimum fee calculated for this transaction, in canonical nicks. */
  minimumFee: Nicks;
  /** Change returned to the connected wallet account, in canonical nicks. */
  change: Nicks;
}

/** @deprecated Use {@link BuildSimpleTransactionRequest}. */
export interface EstimateTransactionFeeRequest {
  /** Recipient address (base58-encoded public key hash / PKH) */
  to: Digest;
  /** Amount to send in nicks (legacy number + canonical string or SDK bigint accepted) */
  amount: NicksLike;
}

/** @deprecated Use the `fee` from {@link BuildSimpleTransactionResponse}. */
export interface EstimateTransactionFeeResponse {
  /**
   * Actual fee encoded in the unsigned snapshot constructed for the estimate.
   * A later build or send may differ if wallet state changes.
   */
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
