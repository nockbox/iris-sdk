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

  /** Sign a raw transaction */
  SIGN_RAW_TX: 'nock_signRawTx',
} as const;

export type ProviderMethod = (typeof PROVIDER_METHODS)[keyof typeof PROVIDER_METHODS];
