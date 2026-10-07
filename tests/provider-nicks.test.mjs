import assert from 'node:assert/strict';
import test from 'node:test';
import { PROVIDER_METHODS } from '../dist/constants.js';
import { NockchainProvider } from '../dist/provider.js';

const buildResponse = {
  tx: {
    version: 1,
    id: 'unsigned-id',
    spends: [],
    display: { inputs: { inputs: [] }, outputs: [] },
    witness_data: { data: [] },
  },
  notes: [
    {
      version: 1,
      origin_page: 54_000,
      name: { first: 'first', last: 'last', _sig: 0 },
      note_data: [],
      assets: '102',
    },
  ],
  outputs: [
    {
      version: 1,
      origin_page: 54_321,
      name: { first: 'out', last: 'last', _sig: 0 },
      note_data: [],
      assets: '99',
    },
  ],
  intentId: 'intent-id',
  accountAddress: 'account',
  to: 'recipient',
  blockHeight: 54_321,
  amount: '99',
  inputTotal: '102',
  fee: '3',
  minimumFee: '2',
  change: '0',
};

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
          case PROVIDER_METHODS.BUILD_SIMPLE_TRANSACTION:
            return buildResponse;
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

test('normalizes bigint build values and returns the complete unsigned snapshot', async () => {
  const { provider, requests } = createProvider();
  await provider.connect();

  const built = await provider.buildSimpleTransaction({
    to: 'recipient',
    amount: 99n,
    fee: 3n,
  });
  assert.equal(requests.at(-1).method, PROVIDER_METHODS.BUILD_SIMPLE_TRANSACTION);
  assert.deepEqual(requests.at(-1).params, { to: 'recipient', amount: '99', fee: '3' });
  assert.deepEqual(built, buildResponse);
  assert.doesNotThrow(() => JSON.stringify(requests.at(-1)));
  assert.doesNotThrow(() => JSON.stringify(built));
  assert.deepEqual(structuredClone(built), buildResponse);

  const withoutFee = await provider.buildSimpleTransaction({ to: 'recipient', amount: '99' });
  assert.deepEqual(withoutFee, buildResponse);
  assert.deepEqual(requests.at(-1).params, { to: 'recipient', amount: '99' });
  assert.equal(Object.hasOwn(requests.at(-1).params, 'fee'), false);
  provider.dispose();
});

test('deprecated fee helper projects from buildSimpleTransaction without a second RPC method', async () => {
  const { provider, requests } = createProvider();
  await provider.connect();

  assert.deepEqual(await provider.estimateTransactionFee({ to: 'recipient', amount: 99n }), {
    fee: '3',
  });
  assert.equal(requests.at(-1).method, PROVIDER_METHODS.BUILD_SIMPLE_TRANSACTION);
  assert.deepEqual(requests.at(-1).params, { to: 'recipient', amount: '99' });
  assert.equal(Object.hasOwn(PROVIDER_METHODS, 'ESTIMATE_TRANSACTION_FEE'), false);
  provider.dispose();
});

test('preserves string and number send inputs', async () => {
  const { provider, requests } = createProvider();
  await provider.connect();

  await provider.sendTransaction({ to: 'recipient', amount: '42', fee: 3 });
  assert.deepEqual(requests.at(-1).params, { to: 'recipient', amount: '42', fee: 3 });

  await provider.sendTransaction({ to: 'recipient', amount: 42 });
  assert.deepEqual(requests.at(-1).params, { to: 'recipient', amount: 42 });
  assert.equal(Object.hasOwn(requests.at(-1).params, 'fee'), false);
  provider.dispose();
});
