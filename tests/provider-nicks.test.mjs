import assert from 'node:assert/strict';
import test from 'node:test';
import { PROVIDER_METHODS } from '../dist/constants.js';
import { NockchainProvider } from '../dist/provider.js';

function createProvider() {
  const requests = [];
  globalThis.window = {
    nockchain: {
      provider: 'iris',
      async request(request) {
        requests.push(request);
        switch (request.method) {
          case PROVIDER_METHODS.CONNECT:
            return {
              account: { type: 'v1', address: 'account' },
              rpcConfig: {
                rpcUrl: 'https://rpc.example',
                networkName: 'test',
                blockExplorerUrl: 'https://explorer.example',
                txEngineActivationHeights: {},
                coinbaseTimelockBlocks: 0,
              },
            };
          case PROVIDER_METHODS.SEND_TRANSACTION:
            return { txid: 'tx', amount: '42', fee: '3' };
          case PROVIDER_METHODS.ESTIMATE_TRANSACTION_FEE:
            return { fee: '3' };
          default:
            throw new Error(`Unexpected method: ${request.method}`);
        }
      },
    },
    addEventListener() {},
    removeEventListener() {},
  };

  return { provider: new NockchainProvider(), requests };
}

test('normalizes bigint send values before invoking the injected provider', async () => {
  const { provider, requests } = createProvider();
  await provider.connect();
  await provider.sendTransaction({ to: 'recipient', amount: 42n, fee: 3n });

  const request = requests.at(-1);
  assert.deepEqual(request.params, { to: 'recipient', amount: '42', fee: '3' });
  assert.doesNotThrow(() => JSON.stringify(request));
  provider.dispose();
});

test('normalizes bigint estimates while preserving string and number send inputs', async () => {
  const { provider, requests } = createProvider();
  await provider.connect();

  await provider.estimateTransactionFee({ to: 'recipient', amount: 99n });
  assert.deepEqual(requests.at(-1).params, { to: 'recipient', amount: '99' });

  await provider.sendTransaction({ to: 'recipient', amount: '42', fee: 3 });
  assert.deepEqual(requests.at(-1).params, { to: 'recipient', amount: '42', fee: 3 });

  await provider.sendTransaction({ to: 'recipient', amount: 42 });
  assert.deepEqual(requests.at(-1).params, { to: 'recipient', amount: 42 });
  assert.equal(Object.hasOwn(requests.at(-1).params, 'fee'), false);
  provider.dispose();
});
