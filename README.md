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
- `buildSimpleTransaction` was introduced with provider API 1 for constructing
  a simple send without signing or broadcasting it. It returns the exact
  unsigned `NockchainTx`, selected input notes, outputs projected at the returned
  block height under the active transaction-engine settings, witness-independent
  `intentId`, recipient, and the canonical amount/fee/change summary used for
  that build.
- A build is an unreserved snapshot. Wallet state can change after it is
  returned, so inputs must be revalidated when signing or sending. The wallet
  must not silently substitute different notes for an approved intent.
- `notes` are provided so callers can inspect or bridge the exact inputs. They
  remain untrusted sidecar data if passed back through `signTx`; Iris resolves
  the transaction inputs against wallet-owned state before signing.
- `intentId` is stable across witness signatures and can be used to verify that
  the transaction signed is the transaction built. The raw transaction ID may
  change when signatures are added.
- `estimateTransactionFee` remains as a deprecated SDK convenience wrapper. It
  calls `buildSimpleTransaction` and returns that build's `fee`; there is no
  separate `nock_estimateTransactionFee` wire method.
- SDK methods accept bigint nicks and normalize them to canonical strings before
  crossing the Chrome extension messaging boundary. Direct low-level provider
  requests should use canonical strings or legacy safe integers.

```typescript
const built = await provider.buildSimpleTransaction({
  to: recipient,
  amount: 1_000_000n,
});

console.log(built.fee, built.minimumFee, built.change);
const signed = await provider.signTx(built.tx, built.notes);
```

## 0.3 migration notes

- **TypeScript breaking change:** `sendTransaction()` is now typed as returning
  `{ txid, amount?, fee? }` instead of `string`. This corrects the API 1 type to
  match the object Iris already returns at runtime. Update code that treated the
  result itself as the transaction ID to read `result.txid` instead.
- API 0 retains its historical bare transaction-ID response. When an API 1
  wallet response is bridged to an API 0 caller, the compatibility layer returns
  the bare `txid` string; API 1 callers receive the object response.
- The unreleased fee-estimation RPC was broadened to
  `nock_buildSimpleTransaction`, introduced with API 1. Older wallets generally
  do not implement it, but compatibility mapping deliberately passes it through
  unchanged so compatible direct callers are not rejected based on source API.
