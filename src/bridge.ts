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
  BuildBridgeTransactionOptions,
} from './bridge-types.js';
import type {
  Lock,
  LockRoot,
  Digest,
  Note,
  NoteData,
  Nicks,
  Noun,
  PbCom2RawTransaction,
  SeedV1,
  SpendCondition,
} from '@nockbox/iris-wasm/iris_wasm.js';
import { base58 } from '@scure/base';
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

function logBridgeDebug(
  options: BuildBridgeTransactionOptions | undefined,
  label: string,
  payload: Record<string, unknown>
): void {
  if (options?.debug !== true) return;
  console.log(`[SDK Bridge] ${label}:`, payload);
}

function parseDigestString(value: string, field: string): Digest {
  const trimmed = value.trim();
  const bytes = base58.decode(trimmed);
  if (bytes.length !== 40) {
    throw new Error(`Invalid ${field}: expected a 40-byte base58 digest`);
  }
  return trimmed as Digest;
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
  config: BridgeConfig,
  options: BuildBridgeTransactionOptions
): Promise<BridgeTransactionResult> {
  if (!isBridgeConfigured(config)) {
    throw new Error('Bridge not configured');
  }
  if (!options?.txEngineSettings) {
    throw new Error('txEngineSettings is required in options (see BuildBridgeTransactionOptions)');
  }
  if (!isEvmAddress(params.destinationAddress)) {
    throw new Error(`Invalid destination address: ${params.destinationAddress}`);
  }
  if (params.inputNotes.length !== params.spendConditions.length) {
    throw new Error(
      `Input note/spend condition length mismatch: ${params.inputNotes.length} notes vs ${params.spendConditions.length} conditions`
    );
  }

  logBridgeDebug(options, 'Build start', {
    destinationAddress: params.destinationAddress,
    amountInNicks: params.amountInNicks,
    inputCount: params.inputNotes.length,
    refundPkh: params.refundPkh,
  });

  const bridgeNounJs = buildBridgeNoun(params.destinationAddress, config);
  const noteData: NoteData = [[config.noteDataKey, bridgeNounJs as Noun]];

  const bridgePkh = wasm.pkhNew(
    BigInt(config.threshold),
    config.addresses.map(address => parseDigestString(address, 'bridge address'))
  );
  const bridgeSpendCondition: SpendCondition = wasm.spendConditionNewPkh(bridgePkh);
  const bridgeLockRoot: LockRoot = wasm.lockFromList([bridgeSpendCondition]);
  const refundPkhObj = wasm.pkhSingle(parseDigestString(params.refundPkh, 'refund pkh'));
  const refundSpendCondition: SpendCondition = wasm.spendConditionNewPkh(refundPkhObj);
  const refundLockRoot: LockRoot = wasm.lockFromList([refundSpendCondition]);

  const builder = new wasm.TxBuilder(options.txEngineSettings);

  let remainingGift = BigInt(params.amountInNicks);

  for (let i = 0; i < params.inputNotes.length; i++) {
    const note = params.inputNotes[i];
    const spendCondition = params.spendConditions[i];
    if (!spendCondition) {
      logBridgeDebug(options, 'Missing spend condition', {
        inputIndex: i,
        noteAssets: note.assets,
      });
      throw new Error('Spend condition is missing for this input note');
    }
    const noteAssets = BigInt(note.assets ?? 0);

    const giftPortion = remainingGift < noteAssets ? remainingGift : noteAssets;
    remainingGift -= giftPortion;

    // V1 inputs require a lock + spend-condition index.
    // Convert the discovered spend condition into a single-leaf lock for this input.
    let spendBuilder: InstanceType<typeof wasm.SpendBuilder>;
    try {
      const inputLock = wasm.lockFromList([spendCondition]);
      spendBuilder = new wasm.SpendBuilder(
        note,
        inputLock,
        0,
        refundLockRoot
      );
    } catch (error) {
      logBridgeDebug(options, 'SpendBuilder creation failed', {
        inputIndex: i,
        noteAssets: note.assets,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    if (giftPortion > 0n) {
      const parentHash = wasm.noteHash(note);
      const seed: SeedV1 = {
        output_source: null,
        lock_root: bridgeLockRoot,
        note_data: noteData,
        gift: giftPortion.toString() as Nicks,
        parent_hash: parentHash,
      };
      spendBuilder.seed(seed);
    }

    spendBuilder.computeRefund(false);
    builder.spend(spendBuilder);

    logBridgeDebug(options, 'Input processed', {
      inputIndex: i,
      noteAssetsNicks: noteAssets.toString(),
      giftPortionNicks: giftPortion.toString(),
      remainingGiftNicks: remainingGift.toString(),
    });
  }

  builder.recalcAndSetFee(false);
  const feeResult = builder.curFee();
  const transaction = builder.build();

  const txId = transaction.id;
  const fee = feeResult;

  logBridgeDebug(options, 'Build complete', {
    txId,
    feeNicks: fee,
    remainingGiftNicks: remainingGift.toString(),
  });

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
  config: BridgeConfig,
  options: BuildBridgeTransactionOptions
): Promise<BridgeValidationResult> {
  if (!options?.txEngineSettings) {
    throw new Error('txEngineSettings is required in options (see BuildBridgeTransactionOptions)');
  }
  try {
    const rawTx = wasm.rawTxFromProtobuf(rawTxProto as PbCom2RawTransaction);
    const outputs = wasm.rawTxOutputs(rawTx, 0, options.txEngineSettings);
    logBridgeDebug(options, 'Validate start', {
      outputCount: outputs.length,
      noteDataKey: config.noteDataKey,
    });

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
      bridgeAmountNicks: bridgeOutput.assets.toString() as Nicks,
      destinationAddress,
      belts,
      noteDataKey: validatedNoteDataKey,
      version: validatedVersion,
      chain: validatedChain,
    };
  } catch (err) {
    logBridgeDebug(options, 'Validate failed', {
      error: err instanceof Error ? err.message : String(err),
    });
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
  config: BridgeConfig,
  options: BuildBridgeTransactionOptions
): Promise<BridgeValidationResult> {
  const result = await validateBridgeTransaction(rawTxProto, config, options);
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
  BuildBridgeTransactionOptions,
  TxEngineSettings,
} from './bridge-types.js';
