/**
 * Provider method constants for Nockchain wallet
 * These methods can be called by dApps via window.nockchain
 */
export declare const PROVIDER_METHODS: {
    /** Connect to the wallet and request access */
    readonly CONNECT: "nock_connect";
    /** Sign an arbitrary message */
    readonly SIGN_MESSAGE: "nock_signMessage";
    /** Sign and send a transaction */
    readonly SEND_TRANSACTION: "nock_sendTransaction";
    /** Get wallet information (PKH + gRPC endpoint) */
    readonly GET_WALLET_INFO: "nock_getWalletInfo";
    /** Sign a raw transaction */
    readonly SIGN_RAW_TX: "nock_signRawTx";
};
export type ProviderMethod = (typeof PROVIDER_METHODS)[keyof typeof PROVIDER_METHODS];
//# sourceMappingURL=constants.d.ts.map