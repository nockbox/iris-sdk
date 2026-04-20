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
  PbCom2Note,
  PbCom2NoteDataEntry,
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
 *
 * Shape: `[version [chain [belt1 [belt2 belt3]]]]` — a chain of right-nested
 * pairs with five hex-encoded atom leaves, matching the Hoon cell stored in
 * the on-chain bridge note.
 */
export function buildBridgeNoun(
  evmAddress: string,
  config: Pick<BridgeConfig, 'chainTag' | 'versionTag'>
): Noun {
  const [belt1, belt2, belt3] = evmAddressToBelts(evmAddress);
  return [
    config.versionTag,
    [config.chainTag, [bigintToAtom(belt1), [bigintToAtom(belt2), bigintToAtom(belt3)]]],
  ] as unknown as Noun;
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

// TODO(iris-wasm): `isAtom` and `readPair` are adapters for `Noun`'s runtime
// shape, not bridge logic. They should live alongside `cue`/`jam` in
// `iris-wasm` (ideally replaced by a proper `nounToJs` that returns nested
// pairs). Keep them here until that package exposes an equivalent.

/**
 * Type guard: is this noun an atom (a leaf, represented as a hex string)?
 *
 * After this returns `true` TypeScript narrows the noun to `string`, so
 * callers can use the value directly without a separate rebinding.
 */
function isAtom(noun: Noun | undefined): noun is string {
  return typeof noun === 'string';
}

/**
 * Read one `[head, tail]` pair out of a noun.
 *
 * A noun is either an atom (string) or a pair of nouns. On-chain the bridge
 * note is stored as a chain of right-nested pairs: `[v [c [b1 [b2 b3]]]]`.
 *
 * The wasm we use here returns that nested structure to JS in a *flattened*
 * form: instead of `["v", ["c", ["b1", ["b2", "b3"]]]]` we receive
 * `["v", "c", "b1", "b2", "b3"]`. Same data, same pairing intent, just
 * collapsed by the serializer on the way across the JS boundary.
 *
 * To read it back as logical pairs we treat the flat array as
 * `[head, ...tail]`: the first element is this pair's head, and everything
 * after it is the tail (itself another noun). This function applies that
 * convention once; call it repeatedly to walk the chain.
 *
 * Returns `null` if the noun is not a pair (e.g. an atom, or malformed).
 */
function readPair(noun: Noun | undefined): [Noun, Noun] | null {
  // The wasm `Noun` type is declared as `string | [Noun]`, but at runtime a
  // pair arrives as a flat array of length >= 2. Re-narrow through `unknown`
  // so we can inspect the real shape.
  const arr = noun as unknown;
  if (!Array.isArray(arr) || arr.length < 2) return null;
  const head = arr[0] as Noun;
  const tail = (arr.length === 2 ? arr[1] : arr.slice(1)) as Noun;
  return [head, tail];
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
  return wasm.jam(nounJs);
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
  const noteData: NoteData = [[config.noteDataKey, bridgeNounJs]];

  const bridgePkh = wasm.pkhNew(
    BigInt(config.threshold),
    config.addresses.map(address => parseDigestString(address, 'bridge address'))
  );
  const bridgeSpendCondition: SpendCondition = wasm.spendConditionNewPkh(bridgePkh);
  const bridgeLockRoot: LockRoot = bridgeSpendCondition as unknown as LockRoot;
  const refundPkhObj = wasm.pkhSingle(parseDigestString(params.refundPkh, 'refund pkh'));
  const refundSpendCondition: SpendCondition = wasm.spendConditionNewPkh(refundPkhObj);
  const refundLockRoot: LockRoot = refundSpendCondition as unknown as LockRoot;

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

    let spendBuilder: InstanceType<typeof wasm.SpendBuilder>;
    try {
      spendBuilder = new wasm.SpendBuilder(
        note,
        spendCondition as unknown as Lock,
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

    // Read each output via its protobuf form so the bridge note data is the raw
    // jammed bytes (blob), not a serde-shaped JS value. 
    const outputData = outputs.map((output: Note) => {
      const proto = wasm.noteToProtobuf(output) as PbCom2Note;
      const version = proto.note_version;
      const v1 = version && 'V1' in version ? version.V1 : undefined;
      const entries: PbCom2NoteDataEntry[] = v1?.note_data?.entries ?? [];
      return {
        assets: BigInt(v1?.assets?.value ?? 0),
        entries,
      };
    });

    let bridgeOutput: (typeof outputData)[0] | null = null;
    for (const output of outputData) {
      if (output.entries.some(e => e.key === config.noteDataKey)) {
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

    const bridgeEntry = bridgeOutput.entries.find(e => e.key === config.noteDataKey);
    if (!bridgeEntry) {
      return {
        valid: false,
        error: `Bridge output missing '${config.noteDataKey}' note data entry`,
      };
    }

    let destinationAddress: string | undefined;
    let belts: [bigint, bigint, bigint] | undefined;
    let validatedVersion: string | undefined;
    let validatedChain: string | undefined;
    const validatedNoteDataKey = bridgeEntry.key;

    try {
      // Deserialize the jammed blob into a noun, then walk it as a chain of
      // right-nested pairs: [version [chain [belt1 [belt2 belt3]]]].
      const noun = wasm.cue(new Uint8Array(bridgeEntry.blob));

      const versionPair = readPair(noun);
      if (!versionPair) {
        return {
          valid: false,
          error: 'Invalid bridge note data structure: expected [version, [chain, belts]]',
        };
      }
      const [version, chainAndBelts] = versionPair;
      if (!isAtom(version)) {
        return { valid: false, error: 'Invalid bridge note data: version is not an atom' };
      }
      if (version !== config.versionTag && version !== String(Number(config.versionTag))) {
        return {
          valid: false,
          error: `Invalid bridge note data version: expected ${config.versionTag}, got ${version}`,
        };
      }
      validatedVersion = version;

      const chainPair = readPair(chainAndBelts);
      if (!chainPair) {
        return { valid: false, error: 'Invalid bridge note data: missing chain and belts' };
      }
      const [chain, beltData] = chainPair;
      if (!isAtom(chain) || chain !== config.chainTag) {
        return {
          valid: false,
          error: `Invalid bridge chain: expected ${config.chainTag}, got ${String(chain)}`,
        };
      }
      validatedChain = chain;

      const belt1Pair = readPair(beltData);
      if (!belt1Pair) {
        return { valid: false, error: 'Invalid bridge note data: invalid belt structure' };
      }
      const [belt1Noun, belt2And3] = belt1Pair;

      const belt2Pair = readPair(belt2And3);
      if (!belt2Pair) {
        return { valid: false, error: 'Invalid bridge note data: invalid belt2/belt3 structure' };
      }
      const [belt2Noun, belt3Noun] = belt2Pair;

      if (!isAtom(belt1Noun) || !isAtom(belt2Noun) || !isAtom(belt3Noun)) {
        return { valid: false, error: 'Invalid bridge note data: belt values are not atoms' };
      }

      const belt1 = BigInt('0x' + belt1Noun);
      const belt2 = BigInt('0x' + belt2Noun);
      const belt3 = BigInt('0x' + belt3Noun);
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
