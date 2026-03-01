/**
 * Bridge utilities for Nockchain ↔ EVM bridging.
 * Encoding uses the Goldilocks prime field (3 belts) for EVM addresses.
 * Consumers provide BridgeConfig; the SDK handles transaction construction and validation.
 */

import type {
  BridgeConfig,
  BridgeTransactionParams,
  BridgeTransactionResult,
  BridgeValidationResult,
} from './bridge-types.js';
import type {
  LockRoot,
  Note,
  NoteData,
  Noun,
  PbCom2RawTransaction,
  SeedV1,
  SpendCondition,
} from '@nockbox/iris-wasm/iris_wasm.js';
import * as wasm from './wasm.js';

// Goldilocks prime: 2^64 - 2^32 + 1
export const GOLDILOCKS_PRIME = 2n ** 64n - 2n ** 32n + 1n;

/** Simple EVM address check (0x + 40 hex chars). No checksum validation. */
export function isEvmAddress(address: string): boolean {
  const s = (address || '').trim();
  const normalized = s.startsWith('0x') ? s : `0x${s}`;
  return /^0x[0-9a-fA-F]{40}$/.test(normalized);
}

/**
 * Convert an EVM address to 3 belts (Goldilocks field elements).
 */
export function evmAddressToBelts(address: string): [bigint, bigint, bigint] {
  if (!isEvmAddress(address)) {
    throw new Error(`Invalid EVM address: ${address}`);
  }
  const normalized = address.startsWith('0x') ? address : `0x${address}`;
  const addr = BigInt(normalized);

  const belt1 = addr % GOLDILOCKS_PRIME;
  const q1 = addr / GOLDILOCKS_PRIME;
  const belt2 = q1 % GOLDILOCKS_PRIME;
  const belt3 = q1 / GOLDILOCKS_PRIME;

  return [belt1, belt2, belt3];
}

/**
 * Convert 3 belts back to an EVM address.
 */
export function beltsToEvmAddress(belt1: bigint, belt2: bigint, belt3: bigint): string {
  const p = GOLDILOCKS_PRIME;
  const address = belt1 + belt2 * p + belt3 * p * p;
  return '0x' + address.toString(16).padStart(40, '0');
}

/** Encode a string as a Hoon cord (little-endian hex). */
export function stringToAtom(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let hex = '';
  for (let i = bytes.length - 1; i >= 0; i--) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex || '0';
}

/** Encode a bigint as hex (no 0x prefix). */
export function bigintToAtom(n: bigint): string {
  if (n === 0n) return '0';
  return n.toString(16);
}

/**
 * Build the bridge noun structure for an EVM address.
 * Structure: [versionTag [chainTag [belt1 [belt2 belt3]]]]
 */
export function buildBridgeNoun(
  evmAddress: string,
  config: Pick<BridgeConfig, 'chainTag' | 'versionTag'>
): unknown {
  const [belt1, belt2, belt3] = evmAddressToBelts(evmAddress);
  return [
    config.versionTag,
    [config.chainTag, [bigintToAtom(belt1), [bigintToAtom(belt2), bigintToAtom(belt3)]]],
  ];
}

/**
 * Verify belt encoding round-trips correctly.
 */
export function verifyBeltEncoding(address: string): boolean {
  if (!isEvmAddress(address)) return false;
  const normalized = address.toLowerCase().startsWith('0x')
    ? address.toLowerCase()
    : `0x${address.toLowerCase()}`;
  const [belt1, belt2, belt3] = evmAddressToBelts(normalized);
  const recovered = beltsToEvmAddress(belt1, belt2, belt3);
  return normalized === recovered;
}

/**
 * Check if a bridge config is valid and usable.
 */
export function isBridgeConfigured(config: BridgeConfig): boolean {
  return (
    config.addresses.length > 0 &&
    config.threshold > 0 &&
    config.threshold <= config.addresses.length
  );
}

/**
 * Create jammed bridge note data for an EVM address (requires WASM).
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function createBridgeNoteData(
  evmAddress: string,
  config: BridgeConfig
): Promise<Uint8Array> {
  const nounJs = buildBridgeNoun(evmAddress, config);
  return wasm.jam(nounJs as Noun);
}

/**
 * Build a bridge transaction (requires WASM).
 * Consumer supplies notes and spend conditions; SDK builds the tx from config.
 */
export async function buildBridgeTransaction(
  params: BridgeTransactionParams,
  config: BridgeConfig
): Promise<BridgeTransactionResult> {
  if (!isBridgeConfigured(config)) {
    throw new Error('Bridge not configured');
  }
  if (!isEvmAddress(params.destinationAddress)) {
    throw new Error(`Invalid destination address: ${params.destinationAddress}`);
  }

  const bridgeNounJs = buildBridgeNoun(params.destinationAddress, config);
  const noteData: NoteData = [[config.noteDataKey, bridgeNounJs as Noun]];

  const bridgeSpendCondition: SpendCondition = [
    { Pkh: { m: config.threshold, hashes: config.addresses } },
  ];
  const bridgeLockRoot: LockRoot = { Lock: bridgeSpendCondition };
  const refundLock: SpendCondition = [{ Pkh: { m: 1, hashes: [params.refundPkh] } }];

  const costPerWord = params.feeOverride ?? config.feePerWord;
  const builder = new wasm.TxBuilder({
    tx_engine_version: 1,
    tx_engine_patch: 0,
    min_fee: '256',
    cost_per_word: costPerWord,
    witness_word_div: 1,
  });

  for (let i = 0; i < params.inputNotes.length; i++) {
    const note = params.inputNotes[i];
    const spendCondition = params.spendConditions[i];

    const spendBuilder = new wasm.SpendBuilder(note, spendCondition, refundLock);

    const parentHash = wasm.note_hash(note);
    const seed: SeedV1 = {
      output_source: null,
      lock_root: bridgeLockRoot,
      note_data: noteData,
      gift: params.amountInNicks,
      parent_hash: parentHash,
    };

    spendBuilder.seed(seed);
    spendBuilder.computeRefund(false);
    builder.spend(spendBuilder);
  }

  builder.recalcAndSetFee(false);
  const feeResult = builder.calcFee();
  const transaction = builder.build();

  const txId = transaction.id;
  const fee = feeResult;

  return {
    transaction,
    txId,
    fee,
  };
}

/**
 * Validate a bridge transaction (pre- or post-signing).
 * Uses config for note key, min amount, and optional lock root.
 */
export async function validateBridgeTransaction(
  rawTxProto: unknown,
  config: BridgeConfig
): Promise<BridgeValidationResult> {
  try {
    const rawTx = wasm.rawTxFromProtobuf(rawTxProto as PbCom2RawTransaction);
    const outputs = wasm.rawTxOutputs(rawTx);

    if (outputs.length === 0) {
      return { valid: false, error: 'Transaction has no outputs' };
    }

    const outputData: Array<{
      assets: bigint;
      noteData: NoteData;
    }> = outputs.map((output: Note) => {
      const noteData = 'note_data' in output ? ((output.note_data as NoteData) ?? []) : [];
      return {
        assets: BigInt(output.assets ?? 0),
        noteData,
      };
    });

    let bridgeOutput: (typeof outputData)[0] | null = null;
    for (const output of outputData) {
      const hasKey = output.noteData?.some(
        (entry: [string, Noun]) => entry[0] === config.noteDataKey
      );
      if (hasKey) {
        bridgeOutput = output;
        break;
      }
    }

    if (!bridgeOutput) {
      return {
        valid: false,
        error: `No output with '${config.noteDataKey}' note data found in transaction`,
      };
    }

    if (BigInt(bridgeOutput.assets) < BigInt(config.minAmountNicks)) {
      return {
        valid: false,
        error: `Bridge amount ${bridgeOutput.assets} nicks is below minimum ${config.minAmountNicks} nicks`,
      };
    }

    if (!bridgeOutput.noteData?.length) {
      return { valid: false, error: 'Bridge output missing note data' };
    }

    const bridgeEntryPair = bridgeOutput.noteData.find(
      (entry: [string, Noun]) => entry[0] === config.noteDataKey
    );
    if (!bridgeEntryPair) {
      return {
        valid: false,
        error: `Bridge output missing '${config.noteDataKey}' note data entry`,
      };
    }
    const bridgeEntryValue = bridgeEntryPair[1];

    let destinationAddress: string | undefined;
    let belts: [bigint, bigint, bigint] | undefined;
    let validatedVersion: string | undefined;
    let validatedChain: string | undefined;
    const validatedNoteDataKey = bridgeEntryPair[0];

    try {
      const value = bridgeEntryValue as unknown;
      const decoded: unknown = Array.isArray(value)
        ? value
        : wasm.cue(
            value instanceof Uint8Array ? value : new Uint8Array(value as unknown as number[])
          );

      if (!Array.isArray(decoded) || decoded.length !== 2) {
        return {
          valid: false,
          error: 'Invalid bridge note data structure: expected [version, [chain, belts]]',
        };
      }

      const version = decoded[0];
      if (version !== config.versionTag && version !== Number(config.versionTag)) {
        return {
          valid: false,
          error: `Invalid bridge note data version: expected ${config.versionTag}, got ${version}`,
        };
      }
      validatedVersion = String(version);

      const chainAndBelts = decoded[1];
      if (!Array.isArray(chainAndBelts) || chainAndBelts.length !== 2) {
        return {
          valid: false,
          error: 'Invalid bridge note data: missing chain and belts',
        };
      }

      const chain = chainAndBelts[0];
      if (String(chain) !== config.chainTag) {
        return {
          valid: false,
          error: `Invalid bridge chain: expected ${config.chainTag}, got ${chain}`,
        };
      }
      validatedChain = String(chain);

      const beltData = chainAndBelts[1];
      if (!Array.isArray(beltData) || beltData.length !== 2) {
        return {
          valid: false,
          error: 'Invalid bridge note data: invalid belt structure',
        };
      }

      const belt1Hex = beltData[0];
      const belt2And3 = beltData[1];
      if (!Array.isArray(belt2And3) || belt2And3.length !== 2) {
        return {
          valid: false,
          error: 'Invalid bridge note data: invalid belt2/belt3 structure',
        };
      }

      const belt2Hex = belt2And3[0];
      const belt3Hex = belt2And3[1];

      const belt1 = BigInt('0x' + belt1Hex);
      const belt2 = BigInt('0x' + belt2Hex);
      const belt3 = BigInt('0x' + belt3Hex);
      belts = [belt1, belt2, belt3];
      destinationAddress = beltsToEvmAddress(belt1, belt2, belt3);

      if (!isEvmAddress(destinationAddress)) {
        return {
          valid: false,
          error: `Reconstructed address is invalid: ${destinationAddress}`,
        };
      }
    } catch (err) {
      return {
        valid: false,
        error: `Failed to decode bridge note data: ${
          err instanceof Error ? err.message : String(err)
        }`,
      };
    }

    return {
      valid: true,
      bridgeAmountNicks: String(bridgeOutput.assets),
      destinationAddress,
      belts,
      noteDataKey: validatedNoteDataKey,
      version: validatedVersion,
      chain: validatedChain,
    };
  } catch (err) {
    return {
      valid: false,
      error: `Transaction validation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Validate and throw if invalid (convenience wrapper).
 */
export async function assertValidBridgeTransaction(
  rawTxProto: unknown,
  context: 'pre-signing' | 'post-signing',
  config: BridgeConfig
): Promise<BridgeValidationResult> {
  const result = await validateBridgeTransaction(rawTxProto, config);
  if (!result.valid) {
    throw new Error(`${context} validation failed: ${result.error}`);
  }
  return result;
}

// Re-export types
export type {
  BridgeConfig,
  BridgeTransactionParams,
  BridgeTransactionResult,
  BridgeValidationResult,
} from './bridge-types.js';
