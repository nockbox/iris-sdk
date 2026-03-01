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
/**
 * Query address balance and return only v0 (Legacy) notes.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function queryV0BalanceForPkh(params) {
    const grpcClient = new wasm.GrpcClient(params.grpcEndpoint);
    const balance = await grpcClient.getBalanceByAddress(params.sourcePkh);
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
    };
}
/**
 * Build a transaction that migrates v0 notes into a v1 PKH lock.
 * Caller must have initialized WASM (e.g. await wasm.default()) before using.
 */
export async function buildV0MigrationTransaction(params) {
    if (!params.v0Notes.length) {
        throw new Error('No v0 notes provided for migration');
    }
    const includeLockData = !!params.includeLockData;
    const costPerWord = params.feePerWord ?? '32768';
    const targetSpendCondition = buildSinglePkhSpendCondition(params.targetV1Pkh);
    const settings = {
        tx_engine_version: 1,
        tx_engine_patch: 0,
        min_fee: '256',
        cost_per_word: costPerWord,
        witness_word_div: 1,
    };
    const builder = new wasm.TxBuilder(settings);
    for (const note of params.v0Notes) {
        const spendBuilder = new wasm.SpendBuilder(note, null, targetSpendCondition);
        // Use refund path to migrate full note value into target lock.
        spendBuilder.computeRefund(includeLockData);
        builder.spend(spendBuilder);
    }
    builder.recalcAndSetFee(includeLockData);
    const feeResult = builder.calcFee();
    const transaction = builder.build();
    const txNotes = builder.allNotes();
    const txId = transaction.id;
    const rawTx = {
        version: 1,
        id: transaction.id,
        spends: transaction.spends,
    };
    return {
        transaction,
        txId,
        fee: feeResult,
        signRawTxPayload: {
            rawTx,
            notes: txNotes.notes.filter((note) => isNoteV0(note)),
            spendConditions: txNotes.spend_conditions,
        },
    };
}
//# sourceMappingURL=migration.js.map