/**
 * Backward-compatibility helpers for SDK request payloads.
 */

import type {
  SendTransactionRequest,
  NicksLike,
  RpcRequest,
  RpcResponse,
  ConnectRequest,
  ConnectResponse,
  SignMessageRequest,
  SignTxRequest,
  SignMessageResponse,
  SignTxResponse,
} from './types.js';
import {
  PbCom2RawTransaction,
  PbCom2Note,
  PbCom2SpendCondition,
  rawTxFromProtobuf,
  rawTxV1ToNockchainTx,
  nockchainTxToRawTx,
  rawTxToProtobuf,
  rawTxInputSpendConditions,
  publicKeyFromHex,
  publicKeyToHex,
  RawTxV1,
  noteToProtobuf,
  noteFromProtobuf,
  spendConditionToProtobuf,
  SpendCondition,
  Digest,
} from './wasm.js';
import * as guard from '@nockbox/iris-wasm/iris_wasm.guard';
import {
  PROVIDER_METHODS,
  RPC_API_VERSION,
  DEFAULT_TX_ENGINE_ACTIVATION_HEIGHTS,
  DEFAULT_COINBASE_TIMELOCK_BLOCKS,
} from './constants.js';

/**
 * Legacy `nock_signRawTx` RPC params (API 0): protobuf raw tx plus matching notes and spend conditions.
 * Compat maps this to v1 `SIGN_TX` with a native `NockchainTx`. v1 callers use `SignTxRequest` instead.
 */
interface LegacySignRawTxRequest {
  rawTx: PbCom2RawTransaction;
  notes: PbCom2Note[];
  spendConditions: PbCom2SpendCondition[];
}

/** Type guard for the legacy `nock_signRawTx` payload shape. */
function isLegacySignRawTxRequest(obj: unknown): obj is LegacySignRawTxRequest {
  if (!obj || typeof obj !== 'object') return false;
  const p = obj as { rawTx?: unknown; notes?: unknown; spendConditions?: unknown };
  return (
    guard.isPbCom2RawTransaction(p.rawTx) &&
    Array.isArray(p.notes) &&
    p.notes.length > 0 &&
    p.notes.every((n: unknown) => guard.isPbCom2Note(n)) &&
    Array.isArray(p.spendConditions) &&
    p.spendConditions.length > 0 &&
    p.spendConditions.every((sc: unknown) => guard.isPbCom2SpendCondition(sc))
  );
}

interface LegacyConnectResponse {
  grpcEndpoint: string;
  pkh: Digest;
}

interface LegacySignMessageResponse {
  signature: string;
  publicKeyHex: string;
}

/** Map an RPC request from one API version to another. */
function mapRequest(request: RpcRequest, fromApi?: string, toApi?: string): RpcRequest {
  if (fromApi === toApi) return request;

  const fromV1 = fromApi === RPC_API_VERSION;
  const toV1 = toApi === RPC_API_VERSION;

  switch (request.method) {
    case PROVIDER_METHODS.CONNECT: {
      if (fromV1 && !toV1) {
        // API 1 → legacy: { api: string } → []
        return { ...request, params: [] };
      }
      if (!fromV1 && toV1) {
        // legacy → API 1: [] → { api: string }
        const connectParams: ConnectRequest = { api: RPC_API_VERSION };
        return { ...request, params: connectParams as unknown };
      }
      return request;
    }
    case PROVIDER_METHODS.SEND_TRANSACTION: {
      if (fromV1 && !toV1) {
        const params = request.params as SendTransactionRequest | undefined;
        return { ...request, params: params ? [params] : request.params };
      }
      if (!fromV1 && toV1) {
        const params = request.params as SendTransactionRequest[] | undefined;
        return { ...request, params: params?.[0] };
      }
      return request;
    }
    case PROVIDER_METHODS.SIGN_MESSAGE: {
      if (fromV1 && !toV1) {
        // API 1 → legacy: { message: string } → [message]
        const params = request.params as unknown as SignMessageRequest | undefined;
        return { ...request, params: params?.message ? [params.message] : request.params };
      }
      if (!fromV1 && toV1) {
        // legacy → API 1: [message] → { message: string }
        const legacyParams = request.params as unknown as unknown[] | undefined;
        const message = legacyParams?.[0] as string | undefined;
        if (message) {
          const signParams: SignMessageRequest = { message };
          return { ...request, params: signParams as unknown };
        }
      }
      return request;
    }
    case PROVIDER_METHODS.GET_WALLET_INFO: {
      return request;
    }
    case 'nock_signRawTx': {
      if (fromV1) {
        throw new Error('signRawTx not implemented for API 1');
      }
      if (toV1) {
        const req = (request as any).params?.[0];
        if (!isLegacySignRawTxRequest(req)) {
          throw new Error('Invalid legacyRawTx');
        }
        const rawTx = rawTxFromProtobuf(req.rawTx);
        if (!guard.isRawTxV1(rawTx)) {
          throw new Error('Only V1 Raw TXs are supported at the moment');
        }
        const tx = rawTxV1ToNockchainTx(rawTx);
        const notes = req.notes.map(n => noteFromProtobuf(n));
        const signParams: SignTxRequest = { tx, notes };
        return { ...request, method: PROVIDER_METHODS.SIGN_TX, params: signParams as unknown };
      }
      return request;
    }
    case PROVIDER_METHODS.SIGN_TX: {
      if (!fromV1) {
        throw new Error('signTx not implemented for API 0');
      }
      if (!toV1) {
        const req = request.params as unknown as SignTxRequest;
        const rawTx = nockchainTxToRawTx(req.tx);
        if (!req.notes) {
          throw new Error('notes not found in SignTxRequest. This is required for API 0 wallets.');
        }
        const notesNative = req.notes;
        const notes = notesNative.map(note => noteToProtobuf(note));
        const spendConditionsNative = rawTxInputSpendConditions(rawTx);
        const spendConditions = spendConditionsNative.map((spendCondition: SpendCondition) =>
          spendConditionToProtobuf(spendCondition)
        );
        const legacyReq = { rawTx, notes, spendConditions };
        return { ...request, method: 'nock_signRawTx', params: [legacyReq] };
      }
      return request;
    }
    default:
      return request;
  }
}

/**
 * Pure request mapper for callers that need request translation without invoking a target.
 */
export function mapRpcRequest(
  request: RpcRequest,
  sourceApi?: string,
  targetApi?: string
): RpcRequest {
  return mapRequest(request, sourceApi, targetApi);
}

/** Map an RPC response from one API version to another. */
function mapResponse(
  method: string,
  response: RpcResponse<unknown>,
  fromApi?: string,
  toApi?: string
): RpcResponse<unknown> {
  if (fromApi === toApi) return response;
  if (response.error) return response;

  const fromV1 = fromApi === RPC_API_VERSION;
  const toV1 = toApi === RPC_API_VERSION;

  switch (method) {
    case PROVIDER_METHODS.CONNECT: {
      if (!fromV1 && toV1) {
        // legacy → API 1: { grpcEndpoint, pkh } → { account, rpcConfig }
        const legacy = response.result as LegacyConnectResponse;
        const result: ConnectResponse = {
          account: { type: 'v1', address: legacy.pkh },
          rpcConfig: {
            rpcUrl: legacy.grpcEndpoint,
            networkName: 'mainnet',
            blockExplorerUrl: '',
            txEngineActivationHeights: DEFAULT_TX_ENGINE_ACTIVATION_HEIGHTS,
            coinbaseTimelockBlocks: DEFAULT_COINBASE_TIMELOCK_BLOCKS,
          },
        };
        return { ...response, result };
      }
      if (fromV1 && !toV1) {
        // API 1 → legacy: { account, rpcConfig } → { grpcEndpoint, pkh }
        const raw = response.result;
        if (raw && typeof raw === 'object') {
          const r = raw as Record<string, unknown>;
          // Extension may already return legacy `{ pkh, grpcEndpoint }` after internal
          // handling; do not assume `account` exists (avoids reading undefined.type).
          if (
            typeof r.pkh === 'string' &&
            typeof r.grpcEndpoint === 'string' &&
            !('account' in r)
          ) {
            return response;
          }
        }
        const v1 = response.result as ConnectResponse;
        if (!v1?.account || v1.account.type !== 'v1') {
          throw new Error('Invalid account type');
        }
        const result: LegacyConnectResponse = {
          grpcEndpoint: v1.rpcConfig.rpcUrl,
          pkh: v1.account.address,
        };
        return { ...response, result };
      }
      return response;
    }
    case PROVIDER_METHODS.SIGN_MESSAGE: {
      if (!fromV1 && toV1) {
        // legacy → API 1: { signature, publicKeyHex } → { signature, publicKey }
        const legacy = response.result as LegacySignMessageResponse;
        const signature = JSON.parse(legacy.signature) as { c: number[]; s: number[] };

        const fromLegacyHex = (bytes: number[]): string => {
          return bytes
            .reverse()
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        };
        const publicKey = publicKeyFromHex(legacy.publicKeyHex);
        if (!publicKey) {
          throw new Error('Invalid public key');
        }
        const result: SignMessageResponse = {
          signature: {
            c: fromLegacyHex(signature.c),
            s: fromLegacyHex(signature.s),
          },
          publicKey,
        };
        return { ...response, result };
      }
      if (fromV1 && !toV1) {
        // API 1 → legacy: { signature, publicKey } → { signature, publicKeyHex }
        const v1 = response.result as SignMessageResponse;

        const toLegacyHex = (v: string | Uint8Array): number[] => {
          if (typeof v === 'string') {
            let bytes = [];
            for (let i = 0; i < v.length; i += 2) {
              bytes.push(parseInt(v.substr(i, 2), 16));
            }
            return bytes.reverse();
          }
          return [...v];
        };
        const signatureJson = JSON.stringify({
          c: toLegacyHex(v1.signature.c),
          s: toLegacyHex(v1.signature.s),
        });

        const result: LegacySignMessageResponse = {
          signature: signatureJson,
          publicKeyHex: publicKeyToHex(v1.publicKey),
        };
        return { ...response, result };
      }
      return response;
    }
    case PROVIDER_METHODS.SIGN_TX: {
      if (fromV1 && !toV1) {
        // Legacy callers reach this path via `nock_signRawTx → SIGN_TX` request
        // remapping, and their historical contract was a bare
        // `PbCom2RawTransaction` (fed straight into `rpcClient.sendTransaction`).
        const v1 = response.result as SignTxResponse;
        if (!v1?.tx) {
          throw new Error('Invalid signTx response');
        }
        const rawTx = nockchainTxToRawTx(v1.tx);
        if (!guard.isRawTxV1(rawTx)) {
          throw new Error('Only V1 Raw TXs are supported at the moment');
        }
        return { ...response, result: rawTxToProtobuf(rawTx) };
      }
      if (!fromV1 && toV1) {
        // Accept both the historical bare shape and the previously-wrapped
        // `{ rawTx }` shape.
        const raw = response.result;
        let legacyRawTx: PbCom2RawTransaction | undefined;
        if (guard.isPbCom2RawTransaction(raw)) {
          legacyRawTx = raw;
        } else if (raw && typeof raw === 'object' && 'rawTx' in (raw as Record<string, unknown>)) {
          const wrapped = (raw as { rawTx?: unknown }).rawTx;
          if (guard.isPbCom2RawTransaction(wrapped)) {
            legacyRawTx = wrapped;
          }
        }
        if (!legacyRawTx) {
          throw new Error('Invalid legacy signRawTx response');
        }
        const rawTx = rawTxFromProtobuf(legacyRawTx);
        if (!guard.isRawTxV1(rawTx)) {
          throw new Error('Only V1 Raw TXs are supported at the moment');
        }
        const tx = rawTxV1ToNockchainTx(rawTx);
        const result = { tx };
        return { ...response, result };
      }
      return response;
    }
    default:
      return response;
  }
}

/**
 * Pure response mapper for callers that already executed a mapped request.
 *
 * `method` should be the method of the mapped request that produced `response`.
 */
export function mapRpcResponse(
  method: string,
  response: RpcResponse<unknown>,
  sourceApi?: string,
  targetApi?: string
): RpcResponse<unknown> {
  return mapResponse(method, response, sourceApi, targetApi);
}

/**
 * Bridge RPC requests between two API versions, converting request params
 * and response payloads as needed.
 *
 * Maps the request from sourceApi → targetApi, calls target, then maps
 * the response back from targetApi → sourceApi (inverted).
 */
export async function requestBridge<Req, Res>(
  request: RpcRequest<Req>,
  target: (request: RpcRequest) => Promise<RpcResponse<unknown>>,
  sourceApi?: string,
  targetApi?: string
): Promise<RpcResponse<Res>> {
  const mappedReq = mapRpcRequest(request, sourceApi, targetApi);
  const res = await target(mappedReq);
  return mapRpcResponse(mappedReq.method, res, targetApi, sourceApi) as RpcResponse<Res>;
}
