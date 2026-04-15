import { Nicks, TxEngineSettings } from '@nockbox/iris-wasm/iris_wasm';

/** Conversion rate: 1 NOCK = 65,536 nicks (2^16). */
export const NOCK_TO_NICKS = 65_536;

/**
 * Provider method constants for Nockchain wallet
 * These methods can be called by dApps via window.nockchain
 */
export const PROVIDER_METHODS = {
  /** Connect to the wallet and request access */
  CONNECT: 'nock_connect',

  /** Sign an arbitrary message */
  SIGN_MESSAGE: 'nock_signMessage',

  /** Sign and send a transaction */
  SEND_TRANSACTION: 'nock_sendTransaction',

  /** Get wallet information (PKH + gRPC endpoint) */
  GET_WALLET_INFO: 'nock_getWalletInfo',

  /** Sign a nockchain transaction */
  SIGN_TX: 'nock_signTx',
} as const;

export type ProviderMethod = (typeof PROVIDER_METHODS)[keyof typeof PROVIDER_METHODS];

export const RPC_API_VERSION = '1.0.0';

export const V0_TX_ENGINE_SETTINGS: TxEngineSettings = {
  tx_engine_version: 0,
  tx_engine_patch: 0,
  min_fee: '0' as Nicks,
  cost_per_word: '0' as Nicks,
  witness_word_div: 0,
};

/** Default V1 tx engine settings (mainnet: v1 from 39000). */
export const V1_TX_ENGINE_SETTINGS: TxEngineSettings = {
  tx_engine_version: 1,
  tx_engine_patch: 0,
  min_fee: '256' as Nicks,
  cost_per_word: String(1 << 15) as Nicks,
  witness_word_div: 1,
};

/** Bythos tx engine (v1 patch 1): witness_word_div 4, min_fee 256 */
export const BYTHOS_TX_ENGINE_SETTINGS: TxEngineSettings = {
  tx_engine_version: 1,
  tx_engine_patch: 1,
  min_fee: '256' as Nicks,
  cost_per_word: String(1 << 14) as Nicks,
  witness_word_div: 4,
};

/**
 * Default mainnet activation map
 */
export const DEFAULT_TX_ENGINE_ACTIVATION_HEIGHTS: Record<number, TxEngineSettings> = {
  1: V0_TX_ENGINE_SETTINGS,
  39000: V1_TX_ENGINE_SETTINGS,
  54000: BYTHOS_TX_ENGINE_SETTINGS,
};

/** Default coinbase maturity in blocks (mainnet-style; e.g. 100). */
export const DEFAULT_COINBASE_TIMELOCK_BLOCKS = 100;