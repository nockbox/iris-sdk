# Iris SDK

TypeScript SDK for integrating dApps with the Iris wallet provider.

## Security model

- The wallet is the signing authority. A dApp must treat approval prompts and
  signatures as user-controlled operations.
- `SignTxRequest.tx` is the canonical transaction. Optional `notes` are retained
  for API 0 compatibility and are untrusted sidecar metadata. Wallets must derive
  review fields from `tx` and independently match inputs to wallet-owned state
  when claiming that a review is verified.
- Provider events delivered through the page's `postMessage` realm are advisory.
  Any page script can forge them, so they must not be used for authorization or
  as proof of wallet state. Re-query the provider before sensitive actions.
- Custom RPC endpoints can observe requests and can return misleading network
  data. Applications should identify the expected network and avoid silently
  changing endpoints or consensus-critical settings.

## Compatibility

The current provider API is version 1. Legacy API 0 transaction signing remains
supported through the compatibility mapper. Optional transaction notes remain in
the request type so existing dApps and API 0 wallets can interoperate, but their
security status is explicitly advisory.
