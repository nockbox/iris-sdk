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

### Transaction fees

- A `sendTransaction` request with `fee` sets that exact fee.
- When `fee` is omitted, the wallet may show an advisory estimate during
  approval, then calculates the actual fee while building the transaction.
- The API 1 response includes the transaction ID, canonical amount, and actual
  fee used. When the request is bridged to an API 0 wallet, only `txid` is
  guaranteed because legacy wallets may return a bare transaction ID.
- `estimateTransactionFee` is read-only and advisory. Wallet state can change
  between estimation and approval, so dApps must use the fee returned by
  `sendTransaction` as the final value.
- SDK methods accept bigint nicks and normalize them to canonical strings before
  crossing the Chrome extension messaging boundary. Direct low-level provider
  requests should use canonical strings or legacy safe integers.

## 0.3 migration notes

- **TypeScript breaking change:** `sendTransaction()` is now typed as returning
  `{ txid, amount?, fee? }` instead of `string`. This corrects the API 1 type to
  match the object Iris already returns at runtime. Update code that treated the
  result itself as the transaction ID to read `result.txid` instead.
- API 0 retains its historical bare transaction-ID response. When an API 1
  wallet response is bridged to an API 0 caller, the compatibility layer returns
  the bare `txid` string; API 1 callers receive the object response.
