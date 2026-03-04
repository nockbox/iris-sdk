import { base58 } from '@scure/base';
import * as wasm from './wasm.js';
function buildSinglePkhSpendCondition(pkh) {
    return [{ Pkh: { m: 1, hashes: [pkh] } }];
}
function isLegacyEntry(entry) {
    return !!entry.note?.note_version && 'Legacy' in entry.note.note_version;
}
function isNoteV0(note) {
    return 'inner' in note && 'sig' in note && 'source' in note;
}
function sumNicks(notes) {
    const total = notes.reduce((acc, note) => acc + BigInt(note.assets), 0n);
    return total.toString();
}
const NOCK_TO_NICKS = 65536;
/**
 * Derive legacy v0 address metadata from mnemonic.
 *
 * v0 discovery queries use the base58-encoded bare public key ("sourceAddress").
 */
export function deriveV0AddressFromMnemonic(mnemonic, passphrase, childIndex) {
    const master = wasm.deriveMasterKeyFromMnemonic(mnemonic, passphrase ?? '');
    const key = childIndex === undefined ? master : master.deriveChild(childIndex);
    const publicKey = Uint8Array.from(key.publicKey);
    const sourceAddress = base58.encode(publicKey);
    return {
        sourceAddress,
    };
}
/**
 * Query address balance and return only v0 (Legacy) notes.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function queryV0BalanceForAddress(grpcEndpoint, address) {
    if (!address) {
        throw new Error('address is required');
    }
    const grpcClient = new wasm.GrpcClient(grpcEndpoint);
    const balance = await grpcClient.getBalanceByAddress(address);
    const v0Notes = [];
    const entries = balance.notes ?? [];
    for (const entry of entries) {
        if (!isLegacyEntry(entry) || !entry.note) {
            continue;
        }
        const parsed = wasm.note_from_protobuf(entry.note);
        if (isNoteV0(parsed)) {
            v0Notes.push(parsed);
        }
    }
    return {
        balance,
        v0Notes,
        totalNicks: sumNicks(v0Notes),
    };
}
/**
 * Derive v0 discovery address from mnemonic and query legacy notes in one step.
 */
export async function queryV0BalanceFromMnemonic(mnemonic, grpcEndpoint, passphrase, childIndex) {
    const derived = deriveV0AddressFromMnemonic(mnemonic, passphrase, childIndex);
    const queried = await queryV0BalanceForAddress(grpcEndpoint, derived.sourceAddress);
    return {
        ...derived,
        ...queried,
    };
}
/** Patch 1 (Bythos) - fee auto-calculated via recalcAndSetFee */
const DEFAULT_TX_ENGINE_SETTINGS = {
    tx_engine_version: 1,
    tx_engine_patch: 1,
    min_fee: '256',
    cost_per_word: '16384', // 1 << 14
    witness_word_div: 4,
};
/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 *
 * @param options.singleNoteOnly - [TEMPORARY] When true, uses single-note logic for testing.
 * @param options.debug - [TEMPORARY] When true, logs the built result to console.
 */
export async function buildV0MigrationTransaction(v0Notes, targetV1Pkh, feePerWord, includeLockData, settings, options) {
    if (!v0Notes.length) {
        throw new Error('No v0 notes provided for migration');
    }
    const singleNoteOnly = options?.singleNoteOnly ?? false;
    const debug = options?.debug ?? false;
    if (singleNoteOnly) {
        const result = await buildV0MigrationTransactionSingleNote(v0Notes, targetV1Pkh, feePerWord, settings, debug);
        return result;
    }
    const includeLockDataVal = !!includeLockData;
    const txSettings = {
        ...DEFAULT_TX_ENGINE_SETTINGS,
        ...settings,
        cost_per_word: feePerWord ?? settings?.cost_per_word ?? DEFAULT_TX_ENGINE_SETTINGS.cost_per_word,
    };
    const targetSpendCondition = buildSinglePkhSpendCondition(targetV1Pkh);
    const builder = new wasm.TxBuilder(txSettings);
    for (const note of v0Notes) {
        const spendBuilder = new wasm.SpendBuilder(note, null, targetSpendCondition);
        // Use refund path to migrate full note value into target lock.
        spendBuilder.computeRefund(includeLockDataVal);
        builder.spend(spendBuilder);
    }
    builder.recalcAndSetFee(includeLockDataVal);
    const feeResult = builder.calcFee();
    const transaction = builder.build();
    const txNotes = builder.allNotes();
    const txId = transaction.id;
    const rawTx = {
        version: 1,
        id: transaction.id,
        spends: transaction.spends,
    };
    const inputNotes = txNotes.notes.filter((note) => isNoteV0(note));
    const spendConditions = txNotes.spend_conditions.length === inputNotes.length
        ? txNotes.spend_conditions
        : inputNotes.map(() => targetSpendCondition);
    const result = {
        transaction,
        txId,
        fee: feeResult,
        signRawTxPayload: {
            rawTx,
            notes: inputNotes,
            spendConditions,
        },
    };
    if (debug) {
        console.log('[SDK Migration] buildV0MigrationTransaction (full)', result);
    }
    return result;
}
/**
 * Single-note migration (same logic as regular path, but one note).
 * Picks any of the smallest notes (there may be multiple with the same size).
 */
async function buildV0MigrationTransactionSingleNote(v0Notes, targetV1Pkh, feePerWord, settings, debug) {
    const targetSpendCondition = buildSinglePkhSpendCondition(targetV1Pkh);
    const txSettings = {
        ...DEFAULT_TX_ENGINE_SETTINGS,
        ...settings,
        cost_per_word: feePerWord ?? settings?.cost_per_word ?? DEFAULT_TX_ENGINE_SETTINGS.cost_per_word,
    };
    const builder = new wasm.TxBuilder(txSettings);
    const candidates = v0Notes.map(note => ({
        note,
        assets: BigInt(note.assets),
    }));
    if (!candidates.length) {
        throw new Error('No v0 notes to migrate.');
    }
    const minAssets = candidates.reduce((min, c) => (c.assets < min ? c.assets : min), candidates[0].assets);
    const selected = candidates.find(c => c.assets === minAssets);
    const spendBuilder = new wasm.SpendBuilder(selected.note, null, targetSpendCondition);
    spendBuilder.computeRefund(false);
    builder.spend(spendBuilder);
    builder.recalcAndSetFee(false);
    const feeNicks = builder.calcFee();
    const transaction = builder.build();
    const txNotes = builder.allNotes();
    const rawTx = {
        version: 1,
        id: transaction.id,
        spends: transaction.spends,
    };
    const feeNicksBigInt = BigInt(feeNicks);
    const inputNotes = txNotes.notes.filter((note) => isNoteV0(note));
    const spendConditions = txNotes.spend_conditions.length === inputNotes.length
        ? txNotes.spend_conditions
        : inputNotes.map(() => targetSpendCondition);
    const result = {
        transaction,
        txId: transaction.id,
        fee: feeNicks,
        migratedNicks: selected.assets.toString(),
        migratedNock: Number(selected.assets) / NOCK_TO_NICKS,
        selectedNoteNicks: selected.assets.toString(),
        selectedNoteNock: Number(selected.assets) / NOCK_TO_NICKS,
        feeNock: Number(feeNicksBigInt) / NOCK_TO_NICKS,
        signRawTxPayload: {
            rawTx,
            notes: inputNotes,
            spendConditions,
        },
    };
    if (debug) {
        console.log('[SDK Migration] buildV0MigrationTransactionSingleNote', result);
    }
    return result;
}
/**
 * Derive v0 address, query legacy notes, and build migration transaction in one step.
 *
 * @param options.singleNoteOnly - [TEMPORARY] When true, migrates 200 NOCK from one note.
 * @param options.debug - [TEMPORARY] When true, logs the built result to console.
 */
export async function buildV0MigrationFromMnemonic(mnemonic, grpcEndpoint, targetV1Pkh, passphrase, childIndex, feePerWord, includeLockData, settings, options) {
    const discovery = await queryV0BalanceFromMnemonic(mnemonic, grpcEndpoint, passphrase, childIndex);
    const buildOptions = options?.singleNoteOnly
        ? { singleNoteOnly: true, debug: options?.debug }
        : { debug: options?.debug };
    const built = await buildV0MigrationTransaction(discovery.v0Notes, targetV1Pkh, feePerWord, includeLockData, settings, buildOptions);
    const result = {
        ...built,
        discovery,
    };
    if (options?.debug) {
        console.log('[SDK Migration] buildV0MigrationFromMnemonic', result);
    }
    return result;
}
/**
 * Build migration from protobuf notes (matches extension API).
 * Caller must have initialized WASM before using.
 */
export async function buildV0MigrationTransactionFromNotes(v0NotesProtobuf, targetV1Pkh, feePerWord = '32768', options) {
    const v0Notes = [];
    for (const notePb of v0NotesProtobuf) {
        const parsed = wasm.note_from_protobuf(notePb);
        if (isNoteV0(parsed)) {
            v0Notes.push(parsed);
        }
    }
    const result = await buildV0MigrationTransactionSingleNote(v0Notes, targetV1Pkh, feePerWord, undefined, options?.debug ?? false);
    return result;
}
//# sourceMappingURL=migration.js.map