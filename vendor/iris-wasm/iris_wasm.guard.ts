/*
 * Generated type guards for "iris_wasm.d.ts".
 * WARNING: Do not manually change this file.
 */
import type { ReadableStreamType, TxNotes, PbCom1BlockHeight, PbCom1NoteVersion, PbCom1WireTag, PbCom1Base58Pubkey, PbCom1SixBelt, PbCom1Nicks, PbCom1BlockHeightDelta, PbCom1RawTransaction, PbCom1Note, PbCom1Hash, PbCom1ErrorStatus, PbCom1Acknowledged, PbCom1Name, PbCom1Signature, PbCom1PageResponse, PbCom1BalanceEntry, PbCom1WalletBalanceData, PbCom1SignatureEntry, PbCom1TimeLockRangeRelative, PbCom1Lock, PbCom1TimeLockIntent, PbCom1Belt, PbCom1ErrorCode, PbCom1Input, PbCom1Base58Hash, PbCom1SchnorrSignature, PbCom1CheetahPoint, PbCom1EightBelt, PbCom1OutputSource, PbCom1TimeLockRangeNeither, PbCom1TimeLockRangeAbsoluteAndRelative, PbCom1Source, PbCom1Spend, PbCom1Wire, PbCom1Seed, PbCom1SchnorrPubkey, PbCom1PageRequest, PbCom1TimeLockRangeAbsolute, PbCom1NamedInput, PbCom2NoteData, PbCom2PkhLock, PbCom2LegacySpend, PbCom2LockTim, PbCom2WitnessSpend, PbCom2NoteDataEntry, PbCom2LockMerkleProof, PbCom2NoteV1, PbCom2PkhSignatureEntry, PbCom2HaxLock, PbCom2Balance, PbCom2LockPrimitive, PbCom2Witness, PbCom2Seed, PbCom2HaxPreimage, PbCom2Spend, PbCom2SpendCondition, PbCom2MerkleProof, PbCom2RawTransaction, PbCom2PkhSignature, PbCom2BurnLock, PbCom2BalanceEntry, PbCom2SpendEntry, PbCom2Note, PbPub2TransactionAcceptedResponse, PbPub2WalletSendTransactionResponse, PbPub2WalletGetBalanceResponse, PbPub2TransactionAcceptedRequest, PbPub2WalletSendTransactionRequest, PbPub2WalletGetBalanceRequest, PbPub2TransactionAcceptedResponseResult, PbCom2LockPrimitivePrimitive, PbPub2WalletGetBalanceRequestSelector, PbCom2NoteNoteVersion, PbPub2WalletSendTransactionResponseResult, PbPri1PeekResponseResult, PbCom2SpendSpendKind, PbPri1PokeResponseResult, PbPri1PeekRequest, PbPri1PeekResponse, PbPri1PokeRequest, PbPri1PokeResponse, PbCom1TimeLockIntentValue, PbCom1WireTagValue, PbPub2WalletGetBalanceResponseResult, SpendCondition, MerkleProof, RawTxV1, NoteData, NockchainTx, SeedV1, LockPrimitive, LockRoot, InputDisplay, Pkh, Spend1V1, Witness, TransactionDisplay, LockMetadata, NoteV1, LockMerkleProof, SpendsV1, SpendV1, Hax, PkhSignature, SeedsV1, WitnessData, Spend0V1, TxEngineSettings, RawTx, NoteInner, NoteV0, SeedsV0, SeedV0, TimelockIntent, LegacySignature, SpendV0, Input, Inputs, Sig, Timelock, RawTxV0, MissingUnlocks, Version, Note, Nicks, Balance, TimelockRange, BalanceUpdate, Source, Name, Signature, PublicKey, Noun, CheetahPoint, Digest, ZMapEntry, ZMap, ZSet, ZSetEntry, ZBase, InitInput, InitOutput, SyncInitInput, TxId, BlockHeight, LockTim } from "./iris_wasm.js";


export function isTxNotes(obj: unknown): obj is TxNotes {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["notes"]) &&
        typedObj["notes"].every((e: any) =>
            isNote(e) as boolean
        ) &&
        Array.isArray(typedObj["spend_conditions"]) &&
        typedObj["spend_conditions"].every((e: any) =>
            isSpendCondition(e) as boolean
        )
    )
}

export function isPbCom1BlockHeight(obj: unknown): obj is PbCom1BlockHeight {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["value"]) as boolean
    )
}

export function isPbCom1NoteVersion(obj: unknown): obj is PbCom1NoteVersion {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["value"]) as boolean
    )
}

export function isPbCom1WireTag(obj: unknown): obj is PbCom1WireTag {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["value"] === "undefined" ||
            (typedObj["value"] !== null &&
                typeof typedObj["value"] === "object" ||
                typeof typedObj["value"] === "function") &&
            isNicks(typedObj["value"]["Text"]) as boolean ||
            (typedObj["value"] !== null &&
                typeof typedObj["value"] === "object" ||
                typeof typedObj["value"] === "function") &&
            isBlockHeight(typedObj["value"]["Number"]) as boolean)
    )
}

export function isPbCom1Base58Pubkey(obj: unknown): obj is PbCom1Base58Pubkey {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["key"]) as boolean
    )
}

export function isPbCom1SixBelt(obj: unknown): obj is PbCom1SixBelt {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["belt_1"] === null ||
            isPbCom1Belt(typedObj["belt_1"]) as boolean) &&
        (typedObj["belt_2"] === null ||
            isPbCom1Belt(typedObj["belt_2"]) as boolean) &&
        (typedObj["belt_3"] === null ||
            isPbCom1Belt(typedObj["belt_3"]) as boolean) &&
        (typedObj["belt_4"] === null ||
            isPbCom1Belt(typedObj["belt_4"]) as boolean) &&
        (typedObj["belt_5"] === null ||
            isPbCom1Belt(typedObj["belt_5"]) as boolean) &&
        (typedObj["belt_6"] === null ||
            isPbCom1Belt(typedObj["belt_6"]) as boolean)
    )
}

export function isPbCom1Nicks(obj: unknown): obj is PbCom1Nicks {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["value"]) as boolean
    )
}

export function isPbCom1BlockHeightDelta(obj: unknown): obj is PbCom1BlockHeightDelta {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["value"]) as boolean
    )
}

export function isPbCom1RawTransaction(obj: unknown): obj is PbCom1RawTransaction {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["named_inputs"]) &&
        typedObj["named_inputs"].every((e: any) =>
            isPbCom1NamedInput(e) as boolean
        ) &&
        (typedObj["timelock_range"] === null ||
            isPbCom1TimeLockRangeAbsolute(typedObj["timelock_range"]) as boolean) &&
        (typedObj["total_fees"] === null ||
            isPbCom1Nicks(typedObj["total_fees"]) as boolean) &&
        isNicks(typedObj["id"]) as boolean
    )
}

export function isPbCom1Note(obj: unknown): obj is PbCom1Note {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["origin_page"] === null ||
            isPbCom1BlockHeight(typedObj["origin_page"]) as boolean) &&
        (typedObj["timelock"] === null ||
            isPbCom1TimeLockIntent(typedObj["timelock"]) as boolean) &&
        (typedObj["name"] === null ||
            isPbCom1Name(typedObj["name"]) as boolean) &&
        (typedObj["lock"] === null ||
            isPbCom1Lock(typedObj["lock"]) as boolean) &&
        (typedObj["source"] === null ||
            isPbCom1Source(typedObj["source"]) as boolean) &&
        (typedObj["assets"] === null ||
            isPbCom1Nicks(typedObj["assets"]) as boolean) &&
        (typedObj["version"] === null ||
            isPbCom1NoteVersion(typedObj["version"]) as boolean)
    )
}

export function isPbCom1Hash(obj: unknown): obj is PbCom1Hash {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["belt_1"] === null ||
            isPbCom1Belt(typedObj["belt_1"]) as boolean) &&
        (typedObj["belt_2"] === null ||
            isPbCom1Belt(typedObj["belt_2"]) as boolean) &&
        (typedObj["belt_3"] === null ||
            isPbCom1Belt(typedObj["belt_3"]) as boolean) &&
        (typedObj["belt_4"] === null ||
            isPbCom1Belt(typedObj["belt_4"]) as boolean) &&
        (typedObj["belt_5"] === null ||
            isPbCom1Belt(typedObj["belt_5"]) as boolean)
    )
}

export function isPbCom1ErrorStatus(obj: unknown): obj is PbCom1ErrorStatus {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["code"]) as boolean &&
        isNicks(typedObj["message"]) as boolean &&
        (typedObj["details"] === null ||
            isNicks(typedObj["details"]) as boolean)
    )
}

export function isPbCom1Acknowledged(obj: unknown): obj is PbCom1Acknowledged {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function")
    )
}

export function isPbCom1Name(obj: unknown): obj is PbCom1Name {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["first"]) as boolean &&
        isNicks(typedObj["last"]) as boolean
    )
}

export function isPbCom1Signature(obj: unknown): obj is PbCom1Signature {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["entries"]) &&
        typedObj["entries"].every((e: any) =>
            isPbCom1SignatureEntry(e) as boolean
        )
    )
}

export function isPbCom1PageResponse(obj: unknown): obj is PbCom1PageResponse {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["next_page_token"]) as boolean
    )
}

export function isPbCom1BalanceEntry(obj: unknown): obj is PbCom1BalanceEntry {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["name"] === null ||
            isPbCom1Name(typedObj["name"]) as boolean) &&
        (typedObj["note"] === null ||
            isPbCom1Note(typedObj["note"]) as boolean)
    )
}

export function isPbCom1WalletBalanceData(obj: unknown): obj is PbCom1WalletBalanceData {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["notes"]) &&
        typedObj["notes"].every((e: any) =>
            isPbCom1BalanceEntry(e) as boolean
        ) &&
        (typedObj["height"] === null ||
            isPbCom1BlockHeight(typedObj["height"]) as boolean) &&
        (typedObj["block_id"] === null ||
            isPbCom1Hash(typedObj["block_id"]) as boolean) &&
        (typedObj["page"] === null ||
            isPbCom1PageResponse(typedObj["page"]) as boolean)
    )
}

export function isPbCom1SignatureEntry(obj: unknown): obj is PbCom1SignatureEntry {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["schnorr_pubkey"] === null ||
            isPbCom1SchnorrPubkey(typedObj["schnorr_pubkey"]) as boolean) &&
        (typedObj["signature"] === null ||
            isPbCom1SchnorrSignature(typedObj["signature"]) as boolean)
    )
}

export function isPbCom1TimeLockRangeRelative(obj: unknown): obj is PbCom1TimeLockRangeRelative {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["min"] === null ||
            isPbCom1BlockHeightDelta(typedObj["min"]) as boolean) &&
        (typedObj["max"] === null ||
            isPbCom1BlockHeightDelta(typedObj["max"]) as boolean)
    )
}

export function isPbCom1Lock(obj: unknown): obj is PbCom1Lock {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["keys_required"]) as boolean &&
        Array.isArray(typedObj["schnorr_pubkeys"]) &&
        typedObj["schnorr_pubkeys"].every((e: any) =>
            isPbCom1SchnorrPubkey(e) as boolean
        )
    )
}

export function isPbCom1TimeLockIntent(obj: unknown): obj is PbCom1TimeLockIntent {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["value"] === "undefined" ||
            (typedObj["value"] !== null &&
                typeof typedObj["value"] === "object" ||
                typeof typedObj["value"] === "function") &&
            isPbCom1TimeLockRangeAbsolute(typedObj["value"]["Absolute"]) as boolean ||
            (typedObj["value"] !== null &&
                typeof typedObj["value"] === "object" ||
                typeof typedObj["value"] === "function") &&
            isPbCom1TimeLockRangeRelative(typedObj["value"]["Relative"]) as boolean ||
            (typedObj["value"] !== null &&
                typeof typedObj["value"] === "object" ||
                typeof typedObj["value"] === "function") &&
            isPbCom1TimeLockRangeAbsoluteAndRelative(typedObj["value"]["AbsoluteAndRelative"]) as boolean ||
            (typedObj["value"] !== null &&
                typeof typedObj["value"] === "object" ||
                typeof typedObj["value"] === "function") &&
            isPbCom1TimeLockRangeNeither(typedObj["value"]["Neither"]) as boolean)
    )
}

export function isPbCom1Belt(obj: unknown): obj is PbCom1Belt {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["value"]) as boolean
    )
}

export function isPbCom1ErrorCode(obj: unknown): obj is PbCom1ErrorCode {
    const typedObj = obj as any
    return (
        (typedObj === "Unspecified" ||
            typedObj === "InvalidRequest" ||
            typedObj === "PeekFailed" ||
            typedObj === "PeekReturnedNoData" ||
            typedObj === "PokeFailed" ||
            typedObj === "NackappError" ||
            typedObj === "Timeout" ||
            typedObj === "InternalError" ||
            typedObj === "NotFound" ||
            typedObj === "PermissionDenied" ||
            typedObj === "InvalidWire" ||
            typedObj === "KernelError")
    )
}

export function isPbCom1Input(obj: unknown): obj is PbCom1Input {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["note"] === null ||
            isPbCom1Note(typedObj["note"]) as boolean) &&
        (typedObj["spend"] === null ||
            isPbCom1Spend(typedObj["spend"]) as boolean)
    )
}

export function isPbCom1Base58Hash(obj: unknown): obj is PbCom1Base58Hash {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["hash"]) as boolean
    )
}

export function isPbCom1SchnorrSignature(obj: unknown): obj is PbCom1SchnorrSignature {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["chal"] === null ||
            isPbCom1EightBelt(typedObj["chal"]) as boolean) &&
        (typedObj["sig"] === null ||
            isPbCom1EightBelt(typedObj["sig"]) as boolean)
    )
}

export function isPbCom1CheetahPoint(obj: unknown): obj is PbCom1CheetahPoint {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["x"] === null ||
            isPbCom1SixBelt(typedObj["x"]) as boolean) &&
        (typedObj["y"] === null ||
            isPbCom1SixBelt(typedObj["y"]) as boolean) &&
        typeof typedObj["inf"] === "boolean"
    )
}

export function isPbCom1EightBelt(obj: unknown): obj is PbCom1EightBelt {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["belt_1"] === null ||
            isPbCom1Belt(typedObj["belt_1"]) as boolean) &&
        (typedObj["belt_2"] === null ||
            isPbCom1Belt(typedObj["belt_2"]) as boolean) &&
        (typedObj["belt_3"] === null ||
            isPbCom1Belt(typedObj["belt_3"]) as boolean) &&
        (typedObj["belt_4"] === null ||
            isPbCom1Belt(typedObj["belt_4"]) as boolean) &&
        (typedObj["belt_5"] === null ||
            isPbCom1Belt(typedObj["belt_5"]) as boolean) &&
        (typedObj["belt_6"] === null ||
            isPbCom1Belt(typedObj["belt_6"]) as boolean) &&
        (typedObj["belt_7"] === null ||
            isPbCom1Belt(typedObj["belt_7"]) as boolean) &&
        (typedObj["belt_8"] === null ||
            isPbCom1Belt(typedObj["belt_8"]) as boolean)
    )
}

export function isPbCom1OutputSource(obj: unknown): obj is PbCom1OutputSource {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["source"] === null ||
            isPbCom1Source(typedObj["source"]) as boolean)
    )
}

export function isPbCom1TimeLockRangeNeither(obj: unknown): obj is PbCom1TimeLockRangeNeither {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function")
    )
}

export function isPbCom1TimeLockRangeAbsoluteAndRelative(obj: unknown): obj is PbCom1TimeLockRangeAbsoluteAndRelative {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["absolute"] === null ||
            isPbCom1TimeLockRangeAbsolute(typedObj["absolute"]) as boolean) &&
        (typedObj["relative"] === null ||
            isPbCom1TimeLockRangeRelative(typedObj["relative"]) as boolean)
    )
}

export function isPbCom1Source(obj: unknown): obj is PbCom1Source {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["hash"]) as boolean &&
        typeof typedObj["coinbase"] === "boolean"
    )
}

export function isPbCom1Spend(obj: unknown): obj is PbCom1Spend {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["signature"] === null ||
            isPbCom1Signature(typedObj["signature"]) as boolean) &&
        Array.isArray(typedObj["seeds"]) &&
        typedObj["seeds"].every((e: any) =>
            isPbCom1Seed(e) as boolean
        ) &&
        (typedObj["miner_fee_nicks"] === null ||
            isPbCom1Nicks(typedObj["miner_fee_nicks"]) as boolean)
    )
}

export function isPbCom1Wire(obj: unknown): obj is PbCom1Wire {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["source"]) as boolean &&
        isBlockHeight(typedObj["version"]) as boolean &&
        Array.isArray(typedObj["tags"]) &&
        typedObj["tags"].every((e: any) =>
            isPbCom1WireTag(e) as boolean
        )
    )
}

export function isPbCom1Seed(obj: unknown): obj is PbCom1Seed {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["output_source"] === null ||
            isPbCom1OutputSource(typedObj["output_source"]) as boolean) &&
        (typedObj["recipient"] === null ||
            isPbCom1Lock(typedObj["recipient"]) as boolean) &&
        (typedObj["timelock_intent"] === null ||
            isPbCom1TimeLockIntent(typedObj["timelock_intent"]) as boolean) &&
        (typedObj["gift"] === null ||
            isPbCom1Nicks(typedObj["gift"]) as boolean) &&
        isNicks(typedObj["parent_hash"]) as boolean
    )
}

export function isPbCom1SchnorrPubkey(obj: unknown): obj is PbCom1SchnorrPubkey {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["value"] === null ||
            isPbCom1CheetahPoint(typedObj["value"]) as boolean)
    )
}

export function isPbCom1PageRequest(obj: unknown): obj is PbCom1PageRequest {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["client_page_items_limit"]) as boolean &&
        isNicks(typedObj["page_token"]) as boolean &&
        isBlockHeight(typedObj["max_bytes"]) as boolean
    )
}

export function isPbCom1TimeLockRangeAbsolute(obj: unknown): obj is PbCom1TimeLockRangeAbsolute {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["min"] === null ||
            isPbCom1BlockHeight(typedObj["min"]) as boolean) &&
        (typedObj["max"] === null ||
            isPbCom1BlockHeight(typedObj["max"]) as boolean)
    )
}

export function isPbCom1NamedInput(obj: unknown): obj is PbCom1NamedInput {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["name"] === null ||
            isPbCom1Name(typedObj["name"]) as boolean) &&
        (typedObj["input"] === null ||
            isPbCom1Input(typedObj["input"]) as boolean)
    )
}

export function isPbCom2NoteData(obj: unknown): obj is PbCom2NoteData {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["entries"]) &&
        typedObj["entries"].every((e: any) =>
            isPbCom2NoteDataEntry(e) as boolean
        )
    )
}

export function isPbCom2PkhLock(obj: unknown): obj is PbCom2PkhLock {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["m"]) as boolean &&
        Array.isArray(typedObj["hashes"]) &&
        typedObj["hashes"].every((e: any) =>
            isNicks(e) as boolean
        )
    )
}

export function isPbCom2LegacySpend(obj: unknown): obj is PbCom2LegacySpend {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["signature"] === "undefined" ||
            isPbCom1Signature(typedObj["signature"]) as boolean) &&
        Array.isArray(typedObj["seeds"]) &&
        typedObj["seeds"].every((e: any) =>
            isPbCom2Seed(e) as boolean
        ) &&
        (typeof typedObj["fee"] === "undefined" ||
            isPbCom1Nicks(typedObj["fee"]) as boolean)
    )
}

export function isPbCom2LockTim(obj: unknown): obj is PbCom2LockTim {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["rel"] === "undefined" ||
            isPbCom1TimeLockRangeRelative(typedObj["rel"]) as boolean) &&
        (typeof typedObj["abs"] === "undefined" ||
            isPbCom1TimeLockRangeAbsolute(typedObj["abs"]) as boolean)
    )
}

export function isPbCom2WitnessSpend(obj: unknown): obj is PbCom2WitnessSpend {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["witness"] === null ||
            isPbCom2Witness(typedObj["witness"]) as boolean) &&
        Array.isArray(typedObj["seeds"]) &&
        typedObj["seeds"].every((e: any) =>
            isPbCom2Seed(e) as boolean
        ) &&
        (typeof typedObj["fee"] === "undefined" ||
            isPbCom1Nicks(typedObj["fee"]) as boolean)
    )
}

export function isPbCom2NoteDataEntry(obj: unknown): obj is PbCom2NoteDataEntry {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["key"]) as boolean &&
        Array.isArray(typedObj["blob"]) &&
        typedObj["blob"].every((e: any) =>
            isBlockHeight(e) as boolean
        )
    )
}

export function isPbCom2LockMerkleProof(obj: unknown): obj is PbCom2LockMerkleProof {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["spend_condition"] === null ||
            isPbCom2SpendCondition(typedObj["spend_condition"]) as boolean) &&
        isBlockHeight(typedObj["axis"]) as boolean &&
        (typedObj["proof"] === null ||
            isPbCom2MerkleProof(typedObj["proof"]) as boolean)
    )
}

export function isPbCom2NoteV1(obj: unknown): obj is PbCom2NoteV1 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["version"] === "undefined" ||
            isPbCom1NoteVersion(typedObj["version"]) as boolean) &&
        (typeof typedObj["origin_page"] === "undefined" ||
            isPbCom1BlockHeight(typedObj["origin_page"]) as boolean) &&
        (typeof typedObj["name"] === "undefined" ||
            isPbCom1Name(typedObj["name"]) as boolean) &&
        (typedObj["note_data"] === null ||
            isPbCom2NoteData(typedObj["note_data"]) as boolean) &&
        (typeof typedObj["assets"] === "undefined" ||
            isPbCom1Nicks(typedObj["assets"]) as boolean)
    )
}

export function isPbCom2PkhSignatureEntry(obj: unknown): obj is PbCom2PkhSignatureEntry {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["hash"]) as boolean &&
        (typeof typedObj["pubkey"] === "undefined" ||
            isPbCom1SchnorrPubkey(typedObj["pubkey"]) as boolean) &&
        (typeof typedObj["signature"] === "undefined" ||
            isPbCom1SchnorrSignature(typedObj["signature"]) as boolean)
    )
}

export function isPbCom2HaxLock(obj: unknown): obj is PbCom2HaxLock {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["hashes"]) &&
        typedObj["hashes"].every((e: any) =>
            isPbCom1Hash(e) as boolean
        )
    )
}

export function isPbCom2Balance(obj: unknown): obj is PbCom2Balance {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["notes"]) &&
        typedObj["notes"].every((e: any) =>
            isPbCom2BalanceEntry(e) as boolean
        ) &&
        (typeof typedObj["height"] === "undefined" ||
            isPbCom1BlockHeight(typedObj["height"]) as boolean) &&
        isNicks(typedObj["block_id"]) as boolean &&
        (typeof typedObj["page"] === "undefined" ||
            isPbCom1PageResponse(typedObj["page"]) as boolean)
    )
}

export function isPbCom2LockPrimitive(obj: unknown): obj is PbCom2LockPrimitive {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["primitive"] === "undefined" ||
            (typedObj["primitive"] !== null &&
                typeof typedObj["primitive"] === "object" ||
                typeof typedObj["primitive"] === "function") &&
            isPbCom2PkhLock(typedObj["primitive"]["Pkh"]) as boolean ||
            (typedObj["primitive"] !== null &&
                typeof typedObj["primitive"] === "object" ||
                typeof typedObj["primitive"] === "function") &&
            isPbCom2LockTim(typedObj["primitive"]["Tim"]) as boolean ||
            (typedObj["primitive"] !== null &&
                typeof typedObj["primitive"] === "object" ||
                typeof typedObj["primitive"] === "function") &&
            isPbCom2HaxLock(typedObj["primitive"]["Hax"]) as boolean ||
            (typedObj["primitive"] !== null &&
                typeof typedObj["primitive"] === "object" ||
                typeof typedObj["primitive"] === "function") &&
            isPbCom2BurnLock(typedObj["primitive"]["Burn"]) as boolean)
    )
}

export function isPbCom2Witness(obj: unknown): obj is PbCom2Witness {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["lock_merkle_proof"] === null ||
            isPbCom2LockMerkleProof(typedObj["lock_merkle_proof"]) as boolean) &&
        (typedObj["pkh_signature"] === null ||
            isPbCom2PkhSignature(typedObj["pkh_signature"]) as boolean) &&
        Array.isArray(typedObj["hax"]) &&
        typedObj["hax"].every((e: any) =>
            isPbCom2HaxPreimage(e) as boolean
        )
    )
}

export function isPbCom2Seed(obj: unknown): obj is PbCom2Seed {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["output_source"] === "undefined" ||
            isPbCom1Source(typedObj["output_source"]) as boolean) &&
        isNicks(typedObj["lock_root"]) as boolean &&
        (typedObj["note_data"] === null ||
            isPbCom2NoteData(typedObj["note_data"]) as boolean) &&
        (typeof typedObj["gift"] === "undefined" ||
            isPbCom1Nicks(typedObj["gift"]) as boolean) &&
        isNicks(typedObj["parent_hash"]) as boolean
    )
}

export function isPbCom2HaxPreimage(obj: unknown): obj is PbCom2HaxPreimage {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["hash"] === "undefined" ||
            isPbCom1Hash(typedObj["hash"]) as boolean) &&
        Array.isArray(typedObj["value"]) &&
        typedObj["value"].every((e: any) =>
            isBlockHeight(e) as boolean
        )
    )
}

export function isPbCom2Spend(obj: unknown): obj is PbCom2Spend {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["spend_kind"] === "undefined" ||
            (typedObj["spend_kind"] !== null &&
                typeof typedObj["spend_kind"] === "object" ||
                typeof typedObj["spend_kind"] === "function") &&
            isPbCom2LegacySpend(typedObj["spend_kind"]["Legacy"]) as boolean ||
            (typedObj["spend_kind"] !== null &&
                typeof typedObj["spend_kind"] === "object" ||
                typeof typedObj["spend_kind"] === "function") &&
            isPbCom2WitnessSpend(typedObj["spend_kind"]["Witness"]) as boolean)
    )
}

export function isPbCom2SpendCondition(obj: unknown): obj is PbCom2SpendCondition {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["primitives"]) &&
        typedObj["primitives"].every((e: any) =>
            isPbCom2LockPrimitive(e) as boolean
        )
    )
}

export function isPbCom2MerkleProof(obj: unknown): obj is PbCom2MerkleProof {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["root"]) as boolean &&
        Array.isArray(typedObj["path"]) &&
        typedObj["path"].every((e: any) =>
            isNicks(e) as boolean
        )
    )
}

export function isPbCom2RawTransaction(obj: unknown): obj is PbCom2RawTransaction {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["version"] === "undefined" ||
            isPbCom1NoteVersion(typedObj["version"]) as boolean) &&
        isNicks(typedObj["id"]) as boolean &&
        Array.isArray(typedObj["spends"]) &&
        typedObj["spends"].every((e: any) =>
            isPbCom2SpendEntry(e) as boolean
        )
    )
}

export function isPbCom2PkhSignature(obj: unknown): obj is PbCom2PkhSignature {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["entries"]) &&
        typedObj["entries"].every((e: any) =>
            isPbCom2PkhSignatureEntry(e) as boolean
        )
    )
}

export function isPbCom2BurnLock(obj: unknown): obj is PbCom2BurnLock {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function")
    )
}

export function isPbCom2BalanceEntry(obj: unknown): obj is PbCom2BalanceEntry {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["name"] === "undefined" ||
            isPbCom1Name(typedObj["name"]) as boolean) &&
        (typedObj["note"] === null ||
            isPbCom2Note(typedObj["note"]) as boolean)
    )
}

export function isPbCom2SpendEntry(obj: unknown): obj is PbCom2SpendEntry {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["name"] === "undefined" ||
            isPbCom1Name(typedObj["name"]) as boolean) &&
        (typedObj["spend"] === null ||
            isPbCom2Spend(typedObj["spend"]) as boolean)
    )
}

export function isPbCom2Note(obj: unknown): obj is PbCom2Note {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["note_version"] === "undefined" ||
            (typedObj["note_version"] !== null &&
                typeof typedObj["note_version"] === "object" ||
                typeof typedObj["note_version"] === "function") &&
            isPbCom1Note(typedObj["note_version"]["Legacy"]) as boolean ||
            (typedObj["note_version"] !== null &&
                typeof typedObj["note_version"] === "object" ||
                typeof typedObj["note_version"] === "function") &&
            isPbCom2NoteV1(typedObj["note_version"]["V1"]) as boolean)
    )
}

export function isPbPub2TransactionAcceptedResponse(obj: unknown): obj is PbPub2TransactionAcceptedResponse {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["result"] === "undefined" ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            typeof typedObj["result"]["Accepted"] === "boolean" ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            isPbCom1ErrorStatus(typedObj["result"]["Error"]) as boolean)
    )
}

export function isPbPub2WalletSendTransactionResponse(obj: unknown): obj is PbPub2WalletSendTransactionResponse {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["result"] === "undefined" ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            isPbCom1Acknowledged(typedObj["result"]["Ack"]) as boolean ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            isPbCom1ErrorStatus(typedObj["result"]["Error"]) as boolean)
    )
}

export function isPbPub2WalletGetBalanceResponse(obj: unknown): obj is PbPub2WalletGetBalanceResponse {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["result"] === "undefined" ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            isPbCom2Balance(typedObj["result"]["Balance"]) as boolean ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            isPbCom1ErrorStatus(typedObj["result"]["Error"]) as boolean)
    )
}

export function isPbPub2TransactionAcceptedRequest(obj: unknown): obj is PbPub2TransactionAcceptedRequest {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["tx_id"] === "undefined" ||
            isPbCom1Base58Hash(typedObj["tx_id"]) as boolean)
    )
}

export function isPbPub2WalletSendTransactionRequest(obj: unknown): obj is PbPub2WalletSendTransactionRequest {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["tx_id"] === "undefined" ||
            isPbCom1Hash(typedObj["tx_id"]) as boolean) &&
        (typeof typedObj["raw_tx"] === "undefined" ||
            isPbCom2RawTransaction(typedObj["raw_tx"]) as boolean)
    )
}

export function isPbPub2WalletGetBalanceRequest(obj: unknown): obj is PbPub2WalletGetBalanceRequest {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["page"] === "undefined" ||
            isPbCom1PageRequest(typedObj["page"]) as boolean) &&
        (typeof typedObj["selector"] === "undefined" ||
            (typedObj["selector"] !== null &&
                typeof typedObj["selector"] === "object" ||
                typeof typedObj["selector"] === "function") &&
            isPbCom1Base58Pubkey(typedObj["selector"]["Address"]) as boolean ||
            (typedObj["selector"] !== null &&
                typeof typedObj["selector"] === "object" ||
                typeof typedObj["selector"] === "function") &&
            isPbCom1Base58Hash(typedObj["selector"]["FirstName"]) as boolean)
    )
}

export function isPbPub2TransactionAcceptedResponseResult(obj: unknown): obj is PbPub2TransactionAcceptedResponseResult {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            typeof typedObj["Accepted"] === "boolean" ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1ErrorStatus(typedObj["Error"]) as boolean)
    )
}

export function isPbCom2LockPrimitivePrimitive(obj: unknown): obj is PbCom2LockPrimitivePrimitive {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isPbCom2PkhLock(typedObj["Pkh"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom2LockTim(typedObj["Tim"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom2HaxLock(typedObj["Hax"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom2BurnLock(typedObj["Burn"]) as boolean)
    )
}

export function isPbPub2WalletGetBalanceRequestSelector(obj: unknown): obj is PbPub2WalletGetBalanceRequestSelector {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isPbCom1Base58Pubkey(typedObj["Address"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1Base58Hash(typedObj["FirstName"]) as boolean)
    )
}

export function isPbCom2NoteNoteVersion(obj: unknown): obj is PbCom2NoteNoteVersion {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isPbCom1Note(typedObj["Legacy"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom2NoteV1(typedObj["V1"]) as boolean)
    )
}

export function isPbPub2WalletSendTransactionResponseResult(obj: unknown): obj is PbPub2WalletSendTransactionResponseResult {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isPbCom1Acknowledged(typedObj["Ack"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1ErrorStatus(typedObj["Error"]) as boolean)
    )
}

export function isPbPri1PeekResponseResult(obj: unknown): obj is PbPri1PeekResponseResult {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            Array.isArray(typedObj["Data"]) &&
            typedObj["Data"].every((e: any) =>
                isBlockHeight(e) as boolean
            ) ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1ErrorStatus(typedObj["Error"]) as boolean)
    )
}

export function isPbCom2SpendSpendKind(obj: unknown): obj is PbCom2SpendSpendKind {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isPbCom2LegacySpend(typedObj["Legacy"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom2WitnessSpend(typedObj["Witness"]) as boolean)
    )
}

export function isPbPri1PokeResponseResult(obj: unknown): obj is PbPri1PokeResponseResult {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            typeof typedObj["Acknowledged"] === "boolean" ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1ErrorStatus(typedObj["Error"]) as boolean)
    )
}

export function isPbPri1PeekRequest(obj: unknown): obj is PbPri1PeekRequest {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["pid"]) as boolean &&
        Array.isArray(typedObj["path"]) &&
        typedObj["path"].every((e: any) =>
            isBlockHeight(e) as boolean
        )
    )
}

export function isPbPri1PeekResponse(obj: unknown): obj is PbPri1PeekResponse {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["result"] === "undefined" ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            Array.isArray(typedObj["result"]["Data"]) &&
            typedObj["result"]["Data"].every((e: any) =>
                isBlockHeight(e) as boolean
            ) ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            isPbCom1ErrorStatus(typedObj["result"]["Error"]) as boolean)
    )
}

export function isPbPri1PokeRequest(obj: unknown): obj is PbPri1PokeRequest {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["pid"]) as boolean &&
        (typeof typedObj["wire"] === "undefined" ||
            isPbCom1Wire(typedObj["wire"]) as boolean) &&
        Array.isArray(typedObj["payload"]) &&
        typedObj["payload"].every((e: any) =>
            isBlockHeight(e) as boolean
        )
    )
}

export function isPbPri1PokeResponse(obj: unknown): obj is PbPri1PokeResponse {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typeof typedObj["result"] === "undefined" ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            typeof typedObj["result"]["Acknowledged"] === "boolean" ||
            (typedObj["result"] !== null &&
                typeof typedObj["result"] === "object" ||
                typeof typedObj["result"] === "function") &&
            isPbCom1ErrorStatus(typedObj["result"]["Error"]) as boolean)
    )
}

export function isPbCom1TimeLockIntentValue(obj: unknown): obj is PbCom1TimeLockIntentValue {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isPbCom1TimeLockRangeAbsolute(typedObj["Absolute"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1TimeLockRangeRelative(typedObj["Relative"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1TimeLockRangeAbsoluteAndRelative(typedObj["AbsoluteAndRelative"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1TimeLockRangeNeither(typedObj["Neither"]) as boolean)
    )
}

export function isPbCom1WireTagValue(obj: unknown): obj is PbCom1WireTagValue {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isNicks(typedObj["Text"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isBlockHeight(typedObj["Number"]) as boolean)
    )
}

export function isPbPub2WalletGetBalanceResponseResult(obj: unknown): obj is PbPub2WalletGetBalanceResponseResult {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isPbCom2Balance(typedObj["Balance"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isPbCom1ErrorStatus(typedObj["Error"]) as boolean)
    )
}

export function isSpendCondition(obj: unknown): obj is SpendCondition {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            isLockPrimitive(e) as boolean
        )
    )
}

export function isMerkleProof(obj: unknown): obj is MerkleProof {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["root"]) as boolean &&
        Array.isArray(typedObj["path"]) &&
        typedObj["path"].every((e: any) =>
            isNicks(e) as boolean
        )
    )
}

export function isRawTxV1(obj: unknown): obj is RawTxV1 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        typedObj["version"] === 1 &&
        isNicks(typedObj["id"]) as boolean &&
        isSpendsV1(typedObj["spends"]) as boolean
    )
}

export function isNoteData(obj: unknown): obj is NoteData {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            Array.isArray(e) &&
            isNicks(e[0]) as boolean &&
            isNoun(e[1]) as boolean
        )
    )
}

export function isNockchainTx(obj: unknown): obj is NockchainTx {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isVersion(typedObj["version"]) as boolean &&
        isNicks(typedObj["id"]) as boolean &&
        isSpendsV1(typedObj["spends"]) as boolean &&
        isTransactionDisplay(typedObj["display"]) as boolean &&
        isWitnessData(typedObj["witness_data"]) as boolean
    )
}

export function isSeedV1(obj: unknown): obj is SeedV1 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["output_source"] === null ||
            isSource(typedObj["output_source"]) as boolean) &&
        isLockRoot(typedObj["lock_root"]) as boolean &&
        isNoteData(typedObj["note_data"]) as boolean &&
        isNicks(typedObj["gift"]) as boolean &&
        isNicks(typedObj["parent_hash"]) as boolean
    )
}

export function isLockPrimitive(obj: unknown): obj is LockPrimitive {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isPkh(typedObj["Pkh"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isTimelock(typedObj["Tim"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isHax(typedObj["Hax"]) as boolean ||
            typedObj === "Brn")
    )
}

export function isLockRoot(obj: unknown): obj is LockRoot {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            isNicks(typedObj["Hash"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            isSpendCondition(typedObj["Lock"]) as boolean)
    )
}

export function isInputDisplay(obj: unknown): obj is InputDisplay {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            typedObj["version"] === 0 &&
            Array.isArray(typedObj["p"]) &&
            typedObj["p"].every((e: any) =>
                Array.isArray(e) &&
                isName(e[0]) as boolean &&
                isSig(e[1]) as boolean
            ) ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            typedObj["version"] === 1 &&
            Array.isArray(typedObj["p"]) &&
            typedObj["p"].every((e: any) =>
                Array.isArray(e) &&
                isName(e[0]) as boolean &&
                isSpendCondition(e[1]) as boolean
            ))
    )
}

export function isPkh(obj: unknown): obj is Pkh {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["m"]) as boolean &&
        Array.isArray(typedObj["hashes"]) &&
        typedObj["hashes"].every((e: any) =>
            isNicks(e) as boolean
        )
    )
}

export function isSpend1V1(obj: unknown): obj is Spend1V1 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isWitness(typedObj["witness"]) as boolean &&
        isSeedsV1(typedObj["seeds"]) as boolean &&
        isNicks(typedObj["fee"]) as boolean
    )
}

export function isWitness(obj: unknown): obj is Witness {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isLockMerkleProof(typedObj["lock_merkle_proof"]) as boolean &&
        isPkhSignature(typedObj["pkh_signature"]) as boolean &&
        Array.isArray(typedObj["hax_map"]) &&
        typedObj["hax_map"].every((e: any) =>
            Array.isArray(e) &&
            isNicks(e[0]) as boolean &&
            isNoun(e[1]) as boolean
        ) &&
        typedObj["tim"] === null
    )
}

export function isTransactionDisplay(obj: unknown): obj is TransactionDisplay {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isInputDisplay(typedObj["inputs"]) as boolean &&
        Array.isArray(typedObj["outputs"]) &&
        typedObj["outputs"].every((e: any) =>
            Array.isArray(e) &&
            isNicks(e[0]) as boolean &&
            isLockMetadata(e[1]) as boolean
        )
    )
}

export function isLockMetadata(obj: unknown): obj is LockMetadata {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isSpendCondition(typedObj["lock"]) as boolean &&
        typeof typedObj["include_data"] === "boolean"
    )
}

export function isNoteV1(obj: unknown): obj is NoteV1 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isVersion(typedObj["version"]) as boolean &&
        isBlockHeight(typedObj["origin_page"]) as boolean &&
        isName(typedObj["name"]) as boolean &&
        isNoteData(typedObj["note_data"]) as boolean &&
        isNicks(typedObj["assets"]) as boolean
    )
}

export function isLockMerkleProof(obj: unknown): obj is LockMerkleProof {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isSpendCondition(typedObj["spend_condition"]) as boolean &&
        isBlockHeight(typedObj["axis"]) as boolean &&
        isMerkleProof(typedObj["proof"]) as boolean
    )
}

export function isSpendsV1(obj: unknown): obj is SpendsV1 {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            Array.isArray(e) &&
            isName(e[0]) as boolean &&
            isSpendV1(e[1]) as boolean
        )
    )
}

export function isSpendV1(obj: unknown): obj is SpendV1 {
    const typedObj = obj as any
    return (
        ((typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
            typedObj["version"] === 0 &&
            isSpend0V1(typedObj["spend"]) as boolean ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            typedObj["version"] === 1 &&
            isSpend1V1(typedObj["spend"]) as boolean)
    )
}

export function isHax(obj: unknown): obj is Hax {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            isNicks(e) as boolean
        )
    )
}

export function isPkhSignature(obj: unknown): obj is PkhSignature {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            Array.isArray(e) &&
            isNicks(e[0]) as boolean &&
            Array.isArray(e[1]) &&
            isNicks(e[1][0]) as boolean &&
            isSignature(e[1][1]) as boolean
        )
    )
}

export function isSeedsV1(obj: unknown): obj is SeedsV1 {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            isSeedV1(e) as boolean
        )
    )
}

export function isWitnessData(obj: unknown): obj is WitnessData {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        Array.isArray(typedObj["data"]) &&
        typedObj["data"].every((e: any) =>
            Array.isArray(e) &&
            isName(e[0]) as boolean &&
            isWitness(e[1]) as boolean
        )
    )
}

export function isSpend0V1(obj: unknown): obj is Spend0V1 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isLegacySignature(typedObj["signature"]) as boolean &&
        isSeedsV1(typedObj["seeds"]) as boolean &&
        isNicks(typedObj["fee"]) as boolean
    )
}

export function isTxEngineSettings(obj: unknown): obj is TxEngineSettings {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isVersion(typedObj["tx_engine_version"]) as boolean &&
        isBlockHeight(typedObj["tx_engine_patch"]) as boolean &&
        isNicks(typedObj["min_fee"]) as boolean &&
        isNicks(typedObj["cost_per_word"]) as boolean &&
        isBlockHeight(typedObj["witness_word_div"]) as boolean
    )
}

export function isRawTx(obj: unknown): obj is RawTx {
    const typedObj = obj as any
    return (
        (isRawTxV1(typedObj) as boolean ||
            isRawTxV0(typedObj) as boolean)
    )
}

export function isNoteInner(obj: unknown): obj is NoteInner {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isVersion(typedObj["version"]) as boolean &&
        isBlockHeight(typedObj["origin_page"]) as boolean &&
        isTimelockIntent(typedObj["timelock"]) as boolean
    )
}

export function isNoteV0(obj: unknown): obj is NoteV0 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNoteInner(typedObj["inner"]) as boolean &&
        isName(typedObj["name"]) as boolean &&
        isSig(typedObj["sig"]) as boolean &&
        isSource(typedObj["source"]) as boolean &&
        isNicks(typedObj["assets"]) as boolean
    )
}

export function isSeedsV0(obj: unknown): obj is SeedsV0 {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            isSeedV0(e) as boolean
        )
    )
}

export function isSeedV0(obj: unknown): obj is SeedV0 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["output_source"] === null ||
            isSource(typedObj["output_source"]) as boolean) &&
        isSig(typedObj["recipient"]) as boolean &&
        isTimelockIntent(typedObj["timelock_intent"]) as boolean &&
        isNicks(typedObj["gift"]) as boolean &&
        isNicks(typedObj["parent_hash"]) as boolean
    )
}

export function isTimelockIntent(obj: unknown): obj is TimelockIntent {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["tim"] === null ||
            isTimelock(typedObj["tim"]) as boolean)
    )
}

export function isLegacySignature(obj: unknown): obj is LegacySignature {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            Array.isArray(e) &&
            isNicks(e[0]) as boolean &&
            isSignature(e[1]) as boolean
        )
    )
}

export function isSpendV0(obj: unknown): obj is SpendV0 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["signature"] === null ||
            isLegacySignature(typedObj["signature"]) as boolean) &&
        isSeedsV0(typedObj["seeds"]) as boolean &&
        isNicks(typedObj["fee"]) as boolean
    )
}

export function isInput(obj: unknown): obj is Input {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNoteV0(typedObj["note"]) as boolean &&
        isSpendV0(typedObj["spend"]) as boolean
    )
}

export function isInputs(obj: unknown): obj is Inputs {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            Array.isArray(e) &&
            isName(e[0]) as boolean &&
            isInput(e[1]) as boolean
        )
    )
}

export function isSig(obj: unknown): obj is Sig {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["m"]) as boolean &&
        Array.isArray(typedObj["pubkeys"]) &&
        typedObj["pubkeys"].every((e: any) =>
            isNicks(e) as boolean
        )
    )
}

export function isTimelock(obj: unknown): obj is Timelock {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isTimelockRange(typedObj["rel"]) as boolean &&
        isTimelockRange(typedObj["abs"]) as boolean
    )
}

export function isRawTxV0(obj: unknown): obj is RawTxV0 {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["id"]) as boolean &&
        isInputs(typedObj["inputs"]) as boolean &&
        isTimelockRange(typedObj["timelock_range"]) as boolean &&
        isNicks(typedObj["total_fees"]) as boolean
    )
}

export function isMissingUnlocks(obj: unknown): obj is MissingUnlocks {
    const typedObj = obj as any
    return (
        (typedObj === "Brn" ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            (typedObj["Pkh"] !== null &&
                typeof typedObj["Pkh"] === "object" ||
                typeof typedObj["Pkh"] === "function") &&
            isBlockHeight(typedObj["Pkh"]["num_sigs"]) as boolean &&
            Array.isArray(typedObj["Pkh"]["sig_of"]) &&
            typedObj["Pkh"]["sig_of"].every((e: any) =>
                isNicks(e) as boolean
            ) ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            (typedObj["Hax"] !== null &&
                typeof typedObj["Hax"] === "object" ||
                typeof typedObj["Hax"] === "function") &&
            Array.isArray(typedObj["Hax"]["preimages_for"]) &&
            typedObj["Hax"]["preimages_for"].every((e: any) =>
                isNicks(e) as boolean
            ) ||
            (typedObj !== null &&
                typeof typedObj === "object" ||
                typeof typedObj === "function") &&
            (typedObj["Sig"] !== null &&
                typeof typedObj["Sig"] === "object" ||
                typeof typedObj["Sig"] === "function") &&
            isBlockHeight(typedObj["Sig"]["num_sigs"]) as boolean &&
            Array.isArray(typedObj["Sig"]["sig_of"]) &&
            typedObj["Sig"]["sig_of"].every((e: any) =>
                isNicks(e) as boolean
            ))
    )
}

export function isVersion(obj: unknown): obj is Version {
    const typedObj = obj as any
    return (
        (typedObj === 0 ||
            typedObj === 2 ||
            typedObj === 1)
    )
}

export function isNote(obj: unknown): obj is Note {
    const typedObj = obj as any
    return (
        (isNoteV1(typedObj) as boolean ||
            isNoteV0(typedObj) as boolean)
    )
}

export function isNicks(obj: unknown): obj is Nicks {
    const typedObj = obj as any
    return (
        typeof typedObj === "string"
    )
}

export function isBalance(obj: unknown): obj is Balance {
    const typedObj = obj as any
    return (
        Array.isArray(typedObj) &&
        typedObj.every((e: any) =>
            Array.isArray(e) &&
            isName(e[0]) as boolean &&
            isNote(e[1]) as boolean
        )
    )
}

export function isTimelockRange(obj: unknown): obj is TimelockRange {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        (typedObj["min"] === null ||
            isBlockHeight(typedObj["min"]) as boolean) &&
        (typedObj["max"] === null ||
            isBlockHeight(typedObj["max"]) as boolean)
    )
}

export function isBalanceUpdate(obj: unknown): obj is BalanceUpdate {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isBlockHeight(typedObj["height"]) as boolean &&
        isNicks(typedObj["block_id"]) as boolean &&
        isBalance(typedObj["notes"]) as boolean
    )
}

export function isSource(obj: unknown): obj is Source {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["hash"]) as boolean &&
        typeof typedObj["is_coinbase"] === "boolean"
    )
}

export function isName(obj: unknown): obj is Name {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["first"]) as boolean &&
        isNicks(typedObj["last"]) as boolean &&
        isBlockHeight(typedObj["_sig"]) as boolean
    )
}

export function isSignature(obj: unknown): obj is Signature {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isNicks(typedObj["c"]) as boolean &&
        isNicks(typedObj["s"]) as boolean
    )
}

export function isPublicKey(obj: unknown): obj is PublicKey {
    const typedObj = obj as any
    return (
        typeof typedObj === "string"
    )
}

export function isNoun(obj: unknown): obj is Noun {
    const typedObj = obj as any
    return (
        (isNicks(typedObj) as boolean ||
            Array.isArray(typedObj) &&
            isNoun(typedObj[0]) as boolean)
    )
}

export function isCheetahPoint(obj: unknown): obj is CheetahPoint {
    const typedObj = obj as any
    return (
        typeof typedObj === "string"
    )
}

export function isDigest(obj: unknown): obj is Digest {
    const typedObj = obj as any
    return (
        typeof typedObj === "string"
    )
}









export function isTxId(obj: unknown): obj is TxId {
    const typedObj = obj as any
    return (
        typeof typedObj === "string"
    )
}

export function isBlockHeight(obj: unknown): obj is BlockHeight {
    const typedObj = obj as any
    return (
        typeof typedObj === "number"
    )
}

export function isLockTim(obj: unknown): obj is LockTim {
    const typedObj = obj as any
    return (
        (typedObj !== null &&
            typeof typedObj === "object" ||
            typeof typedObj === "function") &&
        isTimelockRange(typedObj["rel"]) as boolean &&
        isTimelockRange(typedObj["abs"]) as boolean
    )
}


export function isZBase<E>(obj: unknown, isE: (e: unknown) => e is E): obj is ZBase<E> {
    return Array.isArray(obj) && obj.every(isE);
}

export function isZSetEntry<T>(obj: unknown, isT: (t: unknown) => t is T): obj is ZSetEntry<T> {
    return isT(obj);
}

export function isZSet<T>(obj: unknown, isT: (t: unknown) => t is T): obj is ZSet<T> {
    return isZBase(obj, (e): e is ZSetEntry<T> => isZSetEntry(e, isT));
}

export function isZMapEntry<K, V>(obj: unknown, isK: (k: unknown) => k is K, isV: (v: unknown) => v is V): obj is ZMapEntry<K, V> {
    return Array.isArray(obj) && obj.length === 2 && isK(obj[0]) && isV(obj[1]);
}

export function isZMap<K, V>(obj: unknown, isK: (k: unknown) => k is K, isV: (v: unknown) => v is V): obj is ZMap<K, V> {
    if (!Array.isArray(obj)) return false;
    return obj.every((entry) => isZMapEntry(entry, isK, isV));
}
