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

## Base to Nockchain withdrawals

Version 0.3 adds the canonical retained-contract `WithdrawalWireV1` codec.
Official clients must use this codec instead of calling
`burn(uint256,bytes32)` through a generated ABI helper.

```ts
import { encodeWithdrawalWireV1, validateWithdrawalWireV1 } from '@nockbox/iris-sdk';

const encoded = encodeWithdrawalWireV1({
  nockTokenAddress: '0x1111111111111111111111111111111111111111',
  burnerAddress: connectedAccount,
  amountBaseUnits: 1_000_000_000_000_000_000_000n,
  lockRootLimbs: [1n, 2n, 3n, 4n, 5n],
});

// Use encoded.calldata unchanged for simulation, gas estimation, and sending.
validateWithdrawalWireV1(encoded.calldata, {
  nockTokenAddress: encoded.nockTokenAddress,
  burnerAddress: encoded.burnerAddress,
  amountBaseUnits: encoded.amountBaseUnits,
  lockRootLimbs: encoded.lockRootLimbs,
});
```

The codec:

- returns exactly 116 calldata bytes
- binds token, connected burner, exact bigint amount, and five Tip5 limbs
- locally decodes and validates the final bytes before returning
- enforces `withdrawal-policy-v1` amount divisibility and inclusive
  100,000-NOCK minimum
- throws typed `WithdrawalWireError` values for malformed or stale requests

Changing account, chain, token, amount, or destination invalidates previously
constructed calldata. The application must rebuild before simulation or
submission.

An ordinary 68-byte generated-ABI burn is unsupported even though the retained
contract accepts it. It omits the full destination and can burn funds without a
processable withdrawal.

The published package includes
`test-fixtures/withdrawal_wire_v1_vectors.json`, sourced from the canonical Rust
bridge fixture. SDK consumers can use it to verify byte-for-byte compatibility.
