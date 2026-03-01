/* tslint:disable */
/* eslint-disable */
/**
 * Convert a sequence of belts back into one atom.
 */
export function belts_to_atom(noun: Noun): Noun;
/**
 * Encode a Noun as a Uint8Array of bytes.
 */
export function jam(noun: Noun): Uint8Array;
/**
 * Convert a string to sequence of Belts.
 *
 * This is equivalent to `atom_to_belts(tas(s))`.
 *
 * Belts are Atoms that fit the goldilocks prime field.
 *
 * If a transaction contains non-based (not-fitting) atoms, it will be rejected.
 */
export function tas_belts(s: string): Noun;
/**
 * Convert string to an Atom.
 */
export function tas(s: string): Noun;
/**
 * Cue a jammed Uint8Array into a Noun (see `jam`).
 */
export function cue(jam: Uint8Array): Noun;
/**
 * Convert an Atom to belts.
 */
export function atom_to_belts(atom: Noun): Noun;
/**
 * Convert an Atom into a string.
 */
export function untas(noun: Noun): string;
/**
 * Derive master key from BIP39 mnemonic phrase
 */
export function deriveMasterKeyFromMnemonic(mnemonic: string, passphrase?: string | null): ExtendedKey;
/**
 * Hash a u64 value
 */
export function hashU64(value: bigint): string;
/**
 * Verify a signature with a public key
 */
export function verifySignature(public_key_bytes: Uint8Array, signature: Signature, message: string): boolean;
/**
 * Derive master key from seed bytes
 */
export function deriveMasterKey(seed: Uint8Array): ExtendedKey;
/**
 * Sign a message string with a private key
 */
export function signMessage(private_key_bytes: Uint8Array, message: string): Signature;
/**
 * Hash a public key to get its digest (for use in PKH)
 */
export function hashPublicKey(public_key_bytes: Uint8Array): string;
/**
 * Hash a noun (jam as input)
 */
export function hashNoun(noun: Uint8Array): string;
export function note_to_protobuf(note: Note): PbCom2Note;
/**
 * Convert NockchainTx into RawTx by recombining witness_data with the transaction, and
 * recalculating the transaction ID.
 */
export function nockchainTxToRaw(tx: NockchainTx): RawTx;
export function digest_from_protobuf(value: PbCom1Hash): Digest;
export function spendConditionFirstName(value: SpendCondition): Digest;
/**
 * Convert raw transaction into protobuf format.
 *
 * Protobuf format is the one used by the Nockchain's gRPC interface, and the initial iris
 * extension format. The new iris transaction signing API moves away from this format to use
 * `NockchainTx`, as it includes the necessary spend condition and note information.
 */
export function rawTxToProtobuf(tx: RawTxV1): PbCom2RawTransaction;
export function digest_to_hex(d: Digest): string;
export function create_note_v1(version: Version, origin_page: number, name: Name, note_data: NoteData, assets: Nicks): Note;
export function note_hash(note: Note): Digest;
export function rawTxOutputs(tx: RawTx): Note[];
/**
 * Lossily convert raw transaction into a nockchain transaction, splitting witness away.
 */
export function rawTxToNockchainTx(tx: RawTxV1): NockchainTx;
export function create_note_v0(origin_page: number, sig_m: bigint, sig_pubkeys: Uint8Array[], source_hash: Digest, is_coinbase: boolean, timelock: Timelock | null | undefined, assets: Nicks): Note;
export function hex_to_digest(s: string): Digest;
export function rawTxFromProtobuf(tx: PbCom2RawTransaction): RawTx;
export function note_from_protobuf(value: PbCom2Note): Note;
export function digest_to_protobuf(d: Digest): PbCom1Hash;
/**
 * r" Convert into `Noun`.
 */
export function witnessDataToNoun(v: WitnessData): Noun;
/**
 * r" Convert from `Noun`.
 */
export function witnessDataFromNoun(noun: Noun): WitnessData;
export function lockMetadataHash(v: LockMetadata): Digest;
/**
 * r" Convert from `Noun`.
 */
export function lockMetadataFromNoun(noun: Noun): LockMetadata;
/**
 * r" Convert into `Noun`.
 */
export function lockMetadataToNoun(v: LockMetadata): Noun;
export function sourceHash(v: Source): Digest;
/**
 * r" Convert from `Noun`.
 */
export function sourceFromNoun(noun: Noun): Source;
/**
 * r" Convert into `Noun`.
 */
export function sourceToNoun(v: Source): Noun;
export function timelockHash(v: Timelock): Digest;
/**
 * r" Convert from `Noun`.
 */
export function timelockFromNoun(noun: Noun): Timelock;
/**
 * r" Convert into `Noun`.
 */
export function timelockToNoun(v: Timelock): Noun;
/**
 * r" Convert into `Noun`.
 */
export function haxToNoun(v: Hax): Noun;
/**
 * r" Convert from `Noun`.
 */
export function haxFromNoun(noun: Noun): Hax;
export function haxHash(v: Hax): Digest;
/**
 * r" Convert from `Noun`.
 */
export function pkhFromNoun(noun: Noun): Pkh;
/**
 * r" Convert into `Noun`.
 */
export function pkhToNoun(v: Pkh): Noun;
export function pkhHash(v: Pkh): Digest;
/**
 * r" Convert into `Noun`.
 */
export function noteV1ToNoun(v: NoteV1): Noun;
export function noteV1Hash(v: NoteV1): Digest;
/**
 * r" Convert from `Noun`.
 */
export function noteV1FromNoun(noun: Noun): NoteV1;
/**
 * r" Convert from `Noun`.
 */
export function seedV1FromNoun(noun: Noun): SeedV1;
export function seedV1Hash(v: SeedV1): Digest;
/**
 * r" Convert into `Noun`.
 */
export function seedV1ToNoun(v: SeedV1): Noun;
/**
 * r" Convert from `Noun`.
 */
export function seedsV1FromNoun(noun: Noun): SeedsV1;
/**
 * r" Convert into `Noun`.
 */
export function seedsV1ToNoun(v: SeedsV1): Noun;
export function seedsV1Hash(v: SeedsV1): Digest;
/**
 * r" Convert from `Noun`.
 */
export function lockRootFromNoun(noun: Noun): LockRoot;
/**
 * r" Convert into `Noun`.
 */
export function lockRootToNoun(v: LockRoot): Noun;
export function lockRootHash(v: LockRoot): Digest;
/**
 * r" Convert into `Noun`.
 */
export function pkhSignatureToNoun(v: PkhSignature): Noun;
/**
 * r" Convert from `Noun`.
 */
export function pkhSignatureFromNoun(noun: Noun): PkhSignature;
export function pkhSignatureHash(v: PkhSignature): Digest;
/**
 * r" Convert into `Noun`.
 */
export function lockPrimitiveToNoun(v: LockPrimitive): Noun;
/**
 * r" Convert from `Noun`.
 */
export function lockPrimitiveFromNoun(noun: Noun): LockPrimitive;
export function lockPrimitiveHash(v: LockPrimitive): Digest;
/**
 * r" Convert into `Noun`.
 */
export function spendConditionToNoun(v: SpendCondition): Noun;
/**
 * r" Convert from `Noun`.
 */
export function spendConditionFromNoun(noun: Noun): SpendCondition;
export function spendConditionHash(v: SpendCondition): Digest;
/**
 * r" Convert into `Noun`.
 */
export function lockMerkleProofToNoun(v: LockMerkleProof): Noun;
export function lockMerkleProofHash(v: LockMerkleProof): Digest;
/**
 * r" Convert from `Noun`.
 */
export function lockMerkleProofFromNoun(noun: Noun): LockMerkleProof;
/**
 * r" Convert from `Noun`.
 */
export function nameFromNoun(noun: Noun): Name;
export function nameHash(v: Name): Digest;
/**
 * r" Convert into `Noun`.
 */
export function nameToNoun(v: Name): Noun;
/**
 * r" Convert from `Noun`.
 */
export function rawTxV0FromNoun(noun: Noun): RawTxV0;
/**
 * r" Convert into `Noun`.
 */
export function rawTxV0ToNoun(v: RawTxV0): Noun;
/**
 * r" Convert into `Noun`.
 */
export function inputDisplayToNoun(v: InputDisplay): Noun;
/**
 * r" Convert from `Noun`.
 */
export function inputDisplayFromNoun(noun: Noun): InputDisplay;
export function timelockRangeHash(v: TimelockRange): Digest;
/**
 * r" Convert into `Noun`.
 */
export function timelockRangeToNoun(v: TimelockRange): Noun;
/**
 * r" Convert from `Noun`.
 */
export function timelockRangeFromNoun(noun: Noun): TimelockRange;
/**
 * r" Convert into `Noun`.
 */
export function sigToNoun(v: Sig): Noun;
/**
 * r" Convert from `Noun`.
 */
export function sigFromNoun(noun: Noun): Sig;
export function sigHash(v: Sig): Digest;
export function inputHash(v: Input): Digest;
/**
 * r" Convert into `Noun`.
 */
export function inputToNoun(v: Input): Noun;
/**
 * r" Convert from `Noun`.
 */
export function inputFromNoun(noun: Noun): Input;
/**
 * r" Convert into `Noun`.
 */
export function inputsToNoun(v: Inputs): Noun;
export function inputsHash(v: Inputs): Digest;
/**
 * r" Convert from `Noun`.
 */
export function inputsFromNoun(noun: Noun): Inputs;
export function noteV0Hash(v: NoteV0): Digest;
/**
 * r" Convert into `Noun`.
 */
export function noteV0ToNoun(v: NoteV0): Noun;
/**
 * r" Convert from `Noun`.
 */
export function noteV0FromNoun(noun: Noun): NoteV0;
/**
 * r" Convert from `Noun`.
 */
export function seedV0FromNoun(noun: Noun): SeedV0;
export function seedV0Hash(v: SeedV0): Digest;
/**
 * r" Convert into `Noun`.
 */
export function seedV0ToNoun(v: SeedV0): Noun;
/**
 * r" Convert into `Noun`.
 */
export function seedsV0ToNoun(v: SeedsV0): Noun;
export function seedsV0Hash(v: SeedsV0): Digest;
/**
 * r" Convert from `Noun`.
 */
export function seedsV0FromNoun(noun: Noun): SeedsV0;
/**
 * r" Convert into `Noun`.
 */
export function spendV0ToNoun(v: SpendV0): Noun;
export function spendV0Hash(v: SpendV0): Digest;
/**
 * r" Convert from `Noun`.
 */
export function spendV0FromNoun(noun: Noun): SpendV0;
export function timelockIntentHash(v: TimelockIntent): Digest;
/**
 * r" Convert into `Noun`.
 */
export function timelockIntentToNoun(v: TimelockIntent): Noun;
/**
 * r" Convert from `Noun`.
 */
export function timelockIntentFromNoun(noun: Noun): TimelockIntent;
/**
 * r" Convert into `Noun`.
 */
export function legacySignatureToNoun(v: LegacySignature): Noun;
export function legacySignatureHash(v: LegacySignature): Digest;
/**
 * r" Convert from `Noun`.
 */
export function legacySignatureFromNoun(noun: Noun): LegacySignature;
/**
 * r" Convert into `Noun`.
 */
export function witnessToNoun(v: Witness): Noun;
/**
 * r" Convert from `Noun`.
 */
export function witnessFromNoun(noun: Noun): Witness;
export function witnessHash(v: Witness): Digest;
/**
 * r" Convert into `Noun`.
 */
export function spendV1ToNoun(v: SpendV1): Noun;
/**
 * r" Convert from `Noun`.
 */
export function spendV1FromNoun(noun: Noun): SpendV1;
export function spendV1Hash(v: SpendV1): Digest;
/**
 * r" Convert into `Noun`.
 */
export function noteDataToNoun(v: NoteData): Noun;
export function noteDataHash(v: NoteData): Digest;
/**
 * r" Convert from `Noun`.
 */
export function noteDataFromNoun(noun: Noun): NoteData;
/**
 * r" Convert from `Noun`.
 */
export function rawTxV1FromNoun(noun: Noun): RawTxV1;
/**
 * r" Convert into `Noun`.
 */
export function rawTxV1ToNoun(v: RawTxV1): Noun;
/**
 * r" Convert into `Noun`.
 */
export function spendsV1ToNoun(v: SpendsV1): Noun;
export function spendsV1Hash(v: SpendsV1): Digest;
/**
 * r" Convert from `Noun`.
 */
export function spendsV1FromNoun(noun: Noun): SpendsV1;
export function merkleProofHash(v: MerkleProof): Digest;
/**
 * r" Convert from `Noun`.
 */
export function merkleProofFromNoun(noun: Noun): MerkleProof;
/**
 * r" Convert into `Noun`.
 */
export function merkleProofToNoun(v: MerkleProof): Noun;
/**
 * r" Convert from `Noun`.
 */
export function nockchainTxFromNoun(noun: Noun): NockchainTx;
/**
 * r" Convert into `Noun`.
 */
export function nockchainTxToNoun(v: NockchainTx): Noun;
/**
 * r" Convert into `Noun`.
 */
export function transactionDisplayToNoun(v: TransactionDisplay): Noun;
/**
 * r" Convert from `Noun`.
 */
export function transactionDisplayFromNoun(noun: Noun): TransactionDisplay;
export function noteHash(v: Note): Digest;
/**
 * r" Convert into `Noun`.
 */
export function noteToNoun(v: Note): Noun;
/**
 * r" Convert from `Noun`.
 */
export function noteFromNoun(noun: Noun): Note;
/**
 * r" Convert into `Noun`.
 */
export function balanceToNoun(v: Balance): Noun;
/**
 * r" Convert from `Noun`.
 */
export function balanceFromNoun(noun: Noun): Balance;
/**
 * r" Convert from `Noun`.
 */
export function versionFromNoun(noun: Noun): Version;
export function versionHash(v: Version): Digest;
/**
 * r" Convert into `Noun`.
 */
export function versionToNoun(v: Version): Noun;
/**
 * r" Convert into `Noun`.
 */
export function balanceUpdateToNoun(v: BalanceUpdate): Noun;
/**
 * r" Convert from `Noun`.
 */
export function balanceUpdateFromNoun(noun: Noun): BalanceUpdate;
export function noteInnerHash(v: NoteInner): Digest;
/**
 * r" Convert from `Noun`.
 */
export function noteInnerFromNoun(noun: Noun): NoteInner;
/**
 * r" Convert into `Noun`.
 */
export function noteInnerToNoun(v: NoteInner): Noun;
export function digestHash(v: Digest): Digest;
/**
 * r" Convert into `Noun`.
 */
export function digestToNoun(v: Digest): Noun;
/**
 * r" Convert from `Noun`.
 */
export function digestFromNoun(noun: Noun): Digest;
/**
 * The `ReadableStreamType` enum.
 *
 * *This API requires the following crate features to be activated: `ReadableStreamType`*
 */
type ReadableStreamType = "bytes";
export interface TxNotes {
    notes: Note[];
    spend_conditions: SpendCondition[];
}

export interface PbCom1BlockHeight {
    value: string;
}

/**
 * Note: prefer using raw numeric fields in messages
 * instead of these wrappers to simplify conversions.
 * These remain defined for potential future use.
 */
export interface PbCom1NoteVersion {
    value: string;
}

export interface PbCom1WireTag {
    value: PbCom1WireTagValue | undefined;
}

export interface PbCom1Base58Pubkey {
    key: string;
}

/**
 * pub struct F6lt(pub \\[Belt; 6\\]);
 */
export interface PbCom1SixBelt {
    belt_1: PbCom1Belt | null;
    belt_2: PbCom1Belt | null;
    belt_3: PbCom1Belt | null;
    belt_4: PbCom1Belt | null;
    belt_5: PbCom1Belt | null;
    belt_6: PbCom1Belt | null;
}

export interface PbCom1Nicks {
    value: string;
}

export interface PbCom1BlockHeightDelta {
    value: string;
}

/**
 * the string key is the name of the input
 * message RawTransaction { map<Name, Input> inputs = 1; }
 */
export interface PbCom1RawTransaction {
    named_inputs: PbCom1NamedInput[];
    timelock_range: PbCom1TimeLockRangeAbsolute | null;
    total_fees: PbCom1Nicks | null;
    id: string;
}

export interface PbCom1Note {
    /**
     * page-number when added to balance
     */
    origin_page: PbCom1BlockHeight | null;
    /**
     * enforced timelock
     */
    timelock: PbCom1TimeLockIntent | null;
    /**
     * nname (human/name label)
     */
    name: PbCom1Name | null;
    /**
     * spending condition
     */
    lock: PbCom1Lock | null;
    /**
     * provenance commitment
     */
    source: PbCom1Source | null;
    /**
     * coin amount (nicks)
     */
    assets: PbCom1Nicks | null;
    /**
     * note version (currently 0)
     */
    version: PbCom1NoteVersion | null;
}

/**
 * pub struct Hash(pub \\[Belt; 5\\]);
 * Use fixed fields to avoid variable-length vectors.
 */
export interface PbCom1Hash {
    belt_1: PbCom1Belt | null;
    belt_2: PbCom1Belt | null;
    belt_3: PbCom1Belt | null;
    belt_4: PbCom1Belt | null;
    belt_5: PbCom1Belt | null;
}

export interface PbCom1ErrorStatus {
    code: number;
    message: string;
    /**
     * additional error context
     */
    details: string | null;
}

export interface PbCom1Acknowledged {}

export interface PbCom1Name {
    /**
     * First is the hash of whether the note has a timelock and the lock
     */
    first: string;
    /**
     * Last is the hash of the actual timelock and the source
     */
    last: string;
}

export interface PbCom1Signature {
    entries: PbCom1SignatureEntry[];
}

export interface PbCom1PageResponse {
    /**
     * Opaque cursor for fetching the next page. Empty when there are no more
     * results.
     */
    next_page_token: string;
}

export interface PbCom1BalanceEntry {
    name: PbCom1Name | null;
    note: PbCom1Note | null;
}

export interface PbCom1WalletBalanceData {
    /**
     * Page of full UTXO entries for the requested wallet. Entries are ordered
     * by (Name.first, Name.last) to support consistent pagination.
     *
     * note name -> amount
     */
    notes: PbCom1BalanceEntry[];
    /**
     * Snapshot metadata where this page was computed. Clients should include
     * the returned page token to continue paging against the same snapshot.
     *
     * block height where balance was computed
     */
    height: PbCom1BlockHeight | null;
    /**
     * block where balance was computed
     */
    block_id: PbCom1Hash | null;
    /**
     * Pagination cursor for fetching the next page in a paginated view.
     * When empty, there are no further results for this snapshot.
     */
    page: PbCom1PageResponse | null;
}

export interface PbCom1SignatureEntry {
    /**
     * serialized pubkey corresponding to the signer
     */
    schnorr_pubkey: PbCom1SchnorrPubkey | null;
    signature: PbCom1SchnorrSignature | null;
}

/**
 * min and max are relative to the note\'s creation page
 */
export interface PbCom1TimeLockRangeRelative {
    min: PbCom1BlockHeightDelta | null;
    max: PbCom1BlockHeightDelta | null;
}

export interface PbCom1Lock {
    /**
     * threshold of keys required to spend the note
     */
    keys_required: number;
    /**
     * DEPRECATED: repeated string schnorr_pubkeys_b58 = 2;
     *
     * schnorr pubkeys (curve: cheetah)
     */
    schnorr_pubkeys: PbCom1SchnorrPubkey[];
}

export interface PbCom1TimeLockIntent {
    value: PbCom1TimeLockIntentValue | undefined;
}

/**
 * pub struct Belt(pub u64);
 */
export interface PbCom1Belt {
    value: string;
}

export type PbCom1ErrorCode = "Unspecified" | "InvalidRequest" | "PeekFailed" | "PeekReturnedNoData" | "PokeFailed" | "NackappError" | "Timeout" | "InternalError" | "NotFound" | "PermissionDenied" | "InvalidWire" | "KernelError";

export interface PbCom1Input {
    note: PbCom1Note | null;
    spend: PbCom1Spend | null;
}

export interface PbCom1Base58Hash {
    hash: string;
}

export interface PbCom1SchnorrSignature {
    chal: PbCom1EightBelt | null;
    sig: PbCom1EightBelt | null;
}

/**
 * pub struct CheetahPoint {
 *    pub x: F6lt,
 *    pub y: F6lt,
 *    pub inf: bool,
 * }
 */
export interface PbCom1CheetahPoint {
    x: PbCom1SixBelt | null;
    y: PbCom1SixBelt | null;
    inf: boolean;
}

/**
 * pub chal: \\[Belt; 8\\],
 * pub sig: \\[Belt; 8\\],
 */
export interface PbCom1EightBelt {
    belt_1: PbCom1Belt | null;
    belt_2: PbCom1Belt | null;
    belt_3: PbCom1Belt | null;
    belt_4: PbCom1Belt | null;
    belt_5: PbCom1Belt | null;
    belt_6: PbCom1Belt | null;
    belt_7: PbCom1Belt | null;
    belt_8: PbCom1Belt | null;
}

export interface PbCom1OutputSource {
    source: PbCom1Source | null;
}

/**
 * Use this when you want to force the output to not have a timelock
 */
export interface PbCom1TimeLockRangeNeither {}

export interface PbCom1TimeLockRangeAbsoluteAndRelative {
    absolute: PbCom1TimeLockRangeAbsolute | null;
    relative: PbCom1TimeLockRangeRelative | null;
}

export interface PbCom1Source {
    hash: string;
    coinbase: boolean;
}

export interface PbCom1Spend {
    signature: PbCom1Signature | null;
    seeds: PbCom1Seed[];
    miner_fee_nicks: PbCom1Nicks | null;
}

export interface PbCom1Wire {
    /**
     * e.g., \"http\", \"file\", \"wallet\", \"grpc\
     */
    source: string;
    /**
     * wire format version
     */
    version: number;
    /**
     * operation-specific tags
     */
    tags: PbCom1WireTag[];
}

export interface PbCom1Seed {
    output_source: PbCom1OutputSource | null;
    recipient: PbCom1Lock | null;
    timelock_intent: PbCom1TimeLockIntent | null;
    gift: PbCom1Nicks | null;
    parent_hash: string;
}

/**
 * pub struct SchnorrPubkey(pub CheetahPoint);
 */
export interface PbCom1SchnorrPubkey {
    value: PbCom1CheetahPoint | null;
}

/**
 * Generic pagination parameters for list-style RPCs.
 * These types are intended to be reused across public APIs.
 *
 * Contract:
 * - The server may return fewer items than requested (client_page_items_limit is a hint).
 * - page_token is an opaque cursor produced by the server; clients must treat
 *    it as a black box. Servers may encode snapshot identity and last-key.
 * - For consistent pagination, clients should include the returned page_token
 *    in the next request without modification.
 * - Servers may enforce a maximum client_page_items_limit and/or byte budget regardless of
 *    client hints.
 */
export interface PbCom1PageRequest {
    /**
     * Maximum number of items to return. The server may return fewer items
     * than requested. Clients should not rely on receiving exactly this count.
     */
    client_page_items_limit: number;
    /**
     * Opaque cursor returned by a previous call. When set, the server resumes
     * the listing from the position described by the token.
     * An empty token indicates the first page.
     */
    page_token: string;
    /**
     * Optional soft limit on the uncompressed bytes to return in a single page.
     * The server may ignore or cap this value according to policy. This refers
     * to the gRPC payload size after protobuf encoding and decompression.
     */
    max_bytes: number;
}

/**
 * min and max are absolute origin page numbers
 */
export interface PbCom1TimeLockRangeAbsolute {
    min: PbCom1BlockHeight | null;
    max: PbCom1BlockHeight | null;
}

export interface PbCom1NamedInput {
    name: PbCom1Name | null;
    input: PbCom1Input | null;
}

export interface PbCom2NoteData {
    entries: PbCom2NoteDataEntry[];
}

export interface PbCom2PkhLock {
    m: number;
    hashes: string[];
}

export interface PbCom2LegacySpend {
    signature: PbCom1Signature | undefined;
    seeds: PbCom2Seed[];
    fee: PbCom1Nicks | undefined;
}

export interface PbCom2LockTim {
    rel: PbCom1TimeLockRangeRelative | undefined;
    abs: PbCom1TimeLockRangeAbsolute | undefined;
}

export interface PbCom2WitnessSpend {
    witness: PbCom2Witness | null;
    seeds: PbCom2Seed[];
    fee: PbCom1Nicks | undefined;
}

export interface PbCom2NoteDataEntry {
    key: string;
    /**
     * jammed noun bytes
     */
    blob: number[];
}

export interface PbCom2LockMerkleProof {
    spend_condition: PbCom2SpendCondition | null;
    axis: number;
    proof: PbCom2MerkleProof | null;
}

export interface PbCom2NoteV1 {
    version: PbCom1NoteVersion | undefined;
    origin_page: PbCom1BlockHeight | undefined;
    name: PbCom1Name | undefined;
    note_data: PbCom2NoteData | null;
    assets: PbCom1Nicks | undefined;
}

export interface PbCom2PkhSignatureEntry {
    hash: string;
    pubkey: PbCom1SchnorrPubkey | undefined;
    signature: PbCom1SchnorrSignature | undefined;
}

export interface PbCom2HaxLock {
    hashes: PbCom1Hash[];
}

export interface PbCom2Balance {
    notes: PbCom2BalanceEntry[];
    height: PbCom1BlockHeight | undefined;
    block_id: string;
    page: PbCom1PageResponse | undefined;
}

export interface PbCom2LockPrimitive {
    primitive: PbCom2LockPrimitivePrimitive | undefined;
}

export interface PbCom2Witness {
    lock_merkle_proof: PbCom2LockMerkleProof | null;
    pkh_signature: PbCom2PkhSignature | null;
    /**
     * uint64 tim = 4; // reserved field, currently 0
     */
    hax: PbCom2HaxPreimage[];
}

export interface PbCom2Seed {
    /**
     * Absent when the seed originates from a coinbase output.
     */
    output_source: PbCom1Source | undefined;
    lock_root: string;
    note_data: PbCom2NoteData | null;
    gift: PbCom1Nicks | undefined;
    parent_hash: string;
}

export interface PbCom2HaxPreimage {
    hash: PbCom1Hash | undefined;
    /**
     * jammed noun bytes
     */
    value: number[];
}

export interface PbCom2Spend {
    spend_kind: PbCom2SpendSpendKind | undefined;
}

export interface PbCom2SpendCondition {
    primitives: PbCom2LockPrimitive[];
}

export interface PbCom2MerkleProof {
    root: string;
    path: string[];
}

export interface PbCom2RawTransaction {
    version: PbCom1NoteVersion | undefined;
    id: string;
    spends: PbCom2SpendEntry[];
}

export interface PbCom2PkhSignature {
    entries: PbCom2PkhSignatureEntry[];
}

export interface PbCom2BurnLock {}

export interface PbCom2BalanceEntry {
    name: PbCom1Name | undefined;
    note: PbCom2Note | null;
}

export interface PbCom2SpendEntry {
    name: PbCom1Name | undefined;
    spend: PbCom2Spend | null;
}

export interface PbCom2Note {
    note_version: PbCom2NoteNoteVersion | undefined;
}

export interface PbPub2TransactionAcceptedResponse {
    result: PbPub2TransactionAcceptedResponseResult | undefined;
}

export interface PbPub2WalletSendTransactionResponse {
    result: PbPub2WalletSendTransactionResponseResult | undefined;
}

export interface PbPub2WalletGetBalanceResponse {
    result: PbPub2WalletGetBalanceResponseResult | undefined;
}

export interface PbPub2TransactionAcceptedRequest {
    tx_id: PbCom1Base58Hash | undefined;
}

export interface PbPub2WalletSendTransactionRequest {
    tx_id: PbCom1Hash | undefined;
    raw_tx: PbCom2RawTransaction | undefined;
}

export interface PbPub2WalletGetBalanceRequest {
    page: PbCom1PageRequest | undefined;
    selector: PbPub2WalletGetBalanceRequestSelector | undefined;
}

export type PbPub2TransactionAcceptedResponseResult = { Accepted: boolean } | { Error: PbCom1ErrorStatus };

export type PbCom2LockPrimitivePrimitive = { Pkh: PbCom2PkhLock } | { Tim: PbCom2LockTim } | { Hax: PbCom2HaxLock } | { Burn: PbCom2BurnLock };

export type PbPub2WalletGetBalanceRequestSelector = { Address: PbCom1Base58Pubkey } | { FirstName: PbCom1Base58Hash };

export type PbCom2NoteNoteVersion = { Legacy: PbCom1Note } | { V1: PbCom2NoteV1 };

export type PbPub2WalletSendTransactionResponseResult = { Ack: PbCom1Acknowledged } | { Error: PbCom1ErrorStatus };

export type PbPri1PeekResponseResult = { Data: number[] } | { Error: PbCom1ErrorStatus };

export type PbCom2SpendSpendKind = { Legacy: PbCom2LegacySpend } | { Witness: PbCom2WitnessSpend };

export type PbPri1PokeResponseResult = { Acknowledged: boolean } | { Error: PbCom1ErrorStatus };

export interface PbPri1PeekRequest {
    /**
     * process ID for tracking
     */
    pid: number;
    /**
     * JAM-encoded nock peek path
     */
    path: number[];
}

export interface PbPri1PeekResponse {
    result: PbPri1PeekResponseResult | undefined;
}

export interface PbPri1PokeRequest {
    /**
     * process ID for tracking
     */
    pid: number;
    /**
     * wire routing information
     */
    wire: PbCom1Wire | undefined;
    /**
     * JAM-encoded nock data
     */
    payload: number[];
}

export interface PbPri1PokeResponse {
    result: PbPri1PokeResponseResult | undefined;
}

export type PbCom1TimeLockIntentValue = { Absolute: PbCom1TimeLockRangeAbsolute } | { Relative: PbCom1TimeLockRangeRelative } | { AbsoluteAndRelative: PbCom1TimeLockRangeAbsoluteAndRelative } | { Neither: PbCom1TimeLockRangeNeither };

export type PbCom1WireTagValue = { Text: string } | { Number: number };

export type PbPub2WalletGetBalanceResponseResult = { Balance: PbCom2Balance } | { Error: PbCom1ErrorStatus };

export type SpendCondition = LockPrimitive[];

export interface MerkleProof {
    root: Digest;
    path: Digest[];
}

export interface RawTxV1 {
    version: 1;
    id: TxId;
    spends: SpendsV1;
}

export type NoteData = ZMap<string, Noun>;

export interface NockchainTx {
    version: Version;
    id: TxId;
    spends: SpendsV1;
    display: TransactionDisplay;
    witness_data: WitnessData;
}

export interface SeedV1 {
    output_source: Source | null;
    lock_root: LockRoot;
    note_data: NoteData;
    gift: Nicks;
    parent_hash: Digest;
}

export type LockPrimitive = { Pkh: Pkh } | { Tim: LockTim } | { Hax: Hax } | "Brn";

export type LockRoot = { Hash: Digest } | { Lock: SpendCondition };

export type InputDisplay = { version: 0; p: ZMap<Name, Sig> } | { version: 1; p: ZMap<Name, SpendCondition> };

export interface Pkh {
    m: number;
    hashes: ZSet<Digest>;
}

export interface Spend1V1 {
    witness: Witness;
    seeds: SeedsV1;
    fee: Nicks;
}

export interface Witness {
    lock_merkle_proof: LockMerkleProof;
    pkh_signature: PkhSignature;
    hax_map: ZMap<Digest, Noun>;
    tim: null;
}

export interface TransactionDisplay {
    inputs: InputDisplay;
    outputs: ZMap<Digest, LockMetadata>;
}

export interface LockMetadata {
    lock: SpendCondition;
    include_data: boolean;
}

export interface NoteV1 {
    version: Version;
    origin_page: BlockHeight;
    name: Name;
    note_data: NoteData;
    assets: Nicks;
}

export interface LockMerkleProof {
    spend_condition: SpendCondition;
    axis: number;
    proof: MerkleProof;
}

export type SpendsV1 = ZMap<Name, SpendV1>;

export type SpendV1 = { version: 0; spend: Spend0V1 } | { version: 1; spend: Spend1V1 };

export type Hax = ZSet<Digest>;

export type PkhSignature = ZMap<Digest, [PublicKey, Signature]>;

export type SeedsV1 = ZSet<SeedV1>;

export interface WitnessData {
    data: ZMap<Name, Witness>;
}

export interface Spend0V1 {
    signature: LegacySignature;
    seeds: SeedsV1;
    fee: Nicks;
}

export interface TxEngineSettings {
    tx_engine_version: Version;
    tx_engine_patch: number;
    min_fee: Nicks;
    cost_per_word: Nicks;
    witness_word_div: number;
}

export type RawTx = RawTxV0 | RawTxV1;

export interface NoteInner {
    version: Version;
    origin_page: BlockHeight;
    timelock: TimelockIntent;
}

export interface NoteV0 {
    inner: NoteInner;
    name: Name;
    sig: Sig;
    source: Source;
    assets: Nicks;
}

export type SeedsV0 = ZSet<SeedV0>;

export interface SeedV0 {
    output_source: Source | null;
    recipient: Sig;
    timelock_intent: TimelockIntent;
    gift: Nicks;
    parent_hash: Digest;
}

export interface TimelockIntent {
    tim: Timelock | null;
}

export type LegacySignature = ZMap<PublicKey, Signature>;

export interface SpendV0 {
    signature: LegacySignature | null;
    seeds: SeedsV0;
    fee: Nicks;
}

export interface Input {
    note: NoteV0;
    spend: SpendV0;
}

export type Inputs = ZMap<Name, Input>;

export interface Sig {
    m: number;
    pubkeys: ZSet<PublicKey>;
}

export interface Timelock {
    rel: TimelockRange;
    abs: TimelockRange;
}

export interface RawTxV0 {
    id: TxId;
    inputs: Inputs;
    timelock_range: TimelockRange;
    total_fees: Nicks;
}

export type MissingUnlocks = { Pkh: { num_sigs: number; sig_of: Digest[] } } | { Hax: { preimages_for: Digest[] } } | "Brn" | { Sig: { num_sigs: number; sig_of: PublicKey[] } };

export type Version = 0 | 1 | 2;

export type Note = NoteV0 | NoteV1;

/**
 * 64-bit unsigned integer representing the number of assets.
 */
export type Nicks = string;

export type Balance = ZMap<Name, Note>;

/**
 * Timelock range (for both absolute and relative constraints)
 */
export interface TimelockRange {
    min: BlockHeight | null;
    max: BlockHeight | null;
}

export interface BalanceUpdate {
    height: BlockHeight;
    block_id: Digest;
    notes: Balance;
}

export interface Source {
    hash: Digest;
    is_coinbase: boolean;
}

export interface Name {
    first: Digest;
    last: Digest;
    _sig: number;
}

export interface Signature {
    /**
     * Challenge part in little-endian hex
     */
    c: string;
    /**
     * Signature scalar in little-endian hex
     */
    s: string;
}

export type PublicKey = CheetahPoint;

/**
 * Nock-native data structure
 *
 * A Noun is an Atom or a Cell.
 *
 * A Cell is a pair of Nouns.
 *
 * An Atom is a natural number.
 *
 * Specific to iris, serialized atoms are encoded as little-endian hex strings.
 */
export type Noun = string | [Noun];

export type CheetahPoint = string;

export type Digest = string;

export type ZMapEntry<K, V> = [K, V];

export type ZMap<K, V> = ZBase<ZMapEntry<K, V>>;

export type ZSet<T> = ZBase<ZSetEntry<T>>;

export type ZSetEntry<T> = T;

export type ZBase<E> = E[];

export class ExtendedKey {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Derive a child key at the given index
   */
  deriveChild(index: number): ExtendedKey;
  readonly chainCode: Uint8Array;
  readonly publicKey: Uint8Array;
  readonly privateKey: Uint8Array | undefined;
}
export class GrpcClient {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Send a transaction
   */
  sendTransaction(raw_tx: PbCom2RawTransaction): Promise<string>;
  /**
   * Check if a transaction was accepted
   */
  transactionAccepted(tx_id: string): Promise<boolean>;
  /**
   * Get balance for a wallet address
   */
  getBalanceByAddress(address: string): Promise<PbCom2Balance>;
  /**
   * Get balance for a first name
   */
  getBalanceByFirstName(first_name: string): Promise<PbCom2Balance>;
  constructor(endpoint: string);
  /**
   * Peek a value from a Nock application
   */
  peek(pid: number, path: Noun): Promise<Noun>;
  /**
   * Poke a Nock application
   */
  poke(pid: number, wire: PbCom1Wire, payload: Noun): Promise<void>;
}
export class IntoUnderlyingByteSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  pull(controller: ReadableByteStreamController): Promise<any>;
  start(controller: ReadableByteStreamController): void;
  cancel(): void;
  readonly autoAllocateChunkSize: number;
  readonly type: ReadableStreamType;
}
export class IntoUnderlyingSink {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  abort(reason: any): Promise<any>;
  close(): Promise<any>;
  write(chunk: any): Promise<any>;
}
export class IntoUnderlyingSource {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  pull(controller: ReadableStreamDefaultController): Promise<any>;
  cancel(): void;
}
export class SpendBuilder {
  free(): void;
  [Symbol.dispose](): void;
  curRefund(): SeedV1 | undefined;
  isBalanced(): boolean;
  addPreimage(preimage_jam: Uint8Array): Digest | undefined;
  computeRefund(include_lock_data: boolean): void;
  invalidateSigs(): void;
  missingUnlocks(): MissingUnlocks[];
  fee(fee: Nicks): void;
  /**
   * Create a new `SpendBuilder` with a given note and spend condition
   */
  constructor(note: Note, spend_condition?: SpendCondition | null, refund_lock?: SpendCondition | null);
  seed(seed: SeedV1): void;
  sign(signing_key_bytes: Uint8Array): boolean;
}
export class TxBuilder {
  free(): void;
  [Symbol.dispose](): void;
  allSpends(): SpendBuilder[];
  addPreimage(preimage_jam: Uint8Array): Digest | undefined;
  simpleSpend(notes: Note[], spend_conditions: SpendCondition[], recipient: Digest, gift: Nicks, fee_override: Nicks | null | undefined, refund_pkh: Digest, include_lock_data: boolean): void;
  recalcAndSetFee(include_lock_data: boolean): void;
  setFeeAndBalanceRefund(fee: Nicks, adjust_fee: boolean, include_lock_data: boolean): void;
  /**
   * Create an empty transaction builder
   */
  constructor(settings: TxEngineSettings);
  sign(signing_key_bytes: Uint8Array): void;
  build(): NockchainTx;
  /**
   * Append a `SpendBuilder` to this transaction
   */
  spend(spend: SpendBuilder): SpendBuilder | undefined;
  curFee(): Nicks;
  /**
   * Reconstruct a builder from raw transaction and its input notes.
   */
  static fromTx(tx: RawTx, notes: Note[], spend_conditions: SpendCondition[], settings: TxEngineSettings): TxBuilder;
  calcFee(): Nicks;
  validate(): void;
  allNotes(): TxNotes;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_grpcclient_free: (a: number, b: number) => void;
  readonly atom_to_belts: (a: any) => [number, number, number];
  readonly belts_to_atom: (a: any) => [number, number, number];
  readonly cue: (a: number, b: number) => [number, number, number];
  readonly grpcclient_getBalanceByAddress: (a: number, b: number, c: number) => any;
  readonly grpcclient_getBalanceByFirstName: (a: number, b: number, c: number) => any;
  readonly grpcclient_new: (a: number, b: number) => number;
  readonly grpcclient_peek: (a: number, b: number, c: any) => any;
  readonly grpcclient_poke: (a: number, b: number, c: any, d: any) => any;
  readonly grpcclient_sendTransaction: (a: number, b: any) => any;
  readonly grpcclient_transactionAccepted: (a: number, b: number, c: number) => any;
  readonly jam: (a: any) => [number, number, number, number];
  readonly tas: (a: number, b: number) => any;
  readonly tas_belts: (a: number, b: number) => any;
  readonly untas: (a: any) => [number, number, number, number];
  readonly __wbg_extendedkey_free: (a: number, b: number) => void;
  readonly deriveMasterKey: (a: number, b: number) => number;
  readonly deriveMasterKeyFromMnemonic: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly extendedkey_chainCode: (a: number) => [number, number];
  readonly extendedkey_deriveChild: (a: number, b: number) => [number, number, number];
  readonly extendedkey_privateKey: (a: number) => [number, number];
  readonly extendedkey_publicKey: (a: number) => [number, number];
  readonly hashNoun: (a: number, b: number) => [number, number, number, number];
  readonly hashPublicKey: (a: number, b: number) => [number, number, number, number];
  readonly hashU64: (a: bigint) => [number, number];
  readonly signMessage: (a: number, b: number, c: number, d: number) => [number, number, number];
  readonly verifySignature: (a: number, b: number, c: any, d: number, e: number) => [number, number, number];
  readonly __wbg_spendbuilder_free: (a: number, b: number) => void;
  readonly __wbg_txbuilder_free: (a: number, b: number) => void;
  readonly create_note_v0: (a: number, b: bigint, c: number, d: number, e: any, f: number, g: number, h: any) => [number, number, number];
  readonly create_note_v1: (a: any, b: number, c: any, d: any, e: any) => [number, number, number];
  readonly digest_from_protobuf: (a: any) => [number, number, number];
  readonly digest_to_hex: (a: any) => [number, number];
  readonly digest_to_protobuf: (a: any) => any;
  readonly hex_to_digest: (a: number, b: number) => [number, number, number];
  readonly nockchainTxToRaw: (a: any) => any;
  readonly note_from_protobuf: (a: any) => [number, number, number];
  readonly note_hash: (a: any) => any;
  readonly note_to_protobuf: (a: any) => any;
  readonly rawTxFromProtobuf: (a: any) => [number, number, number];
  readonly rawTxOutputs: (a: any) => [number, number];
  readonly rawTxToNockchainTx: (a: any) => any;
  readonly rawTxToProtobuf: (a: any) => any;
  readonly spendConditionFirstName: (a: any) => any;
  readonly spendbuilder_addPreimage: (a: number, b: number, c: number) => [number, number, number];
  readonly spendbuilder_computeRefund: (a: number, b: number) => void;
  readonly spendbuilder_curRefund: (a: number) => any;
  readonly spendbuilder_fee: (a: number, b: any) => void;
  readonly spendbuilder_invalidateSigs: (a: number) => void;
  readonly spendbuilder_isBalanced: (a: number) => number;
  readonly spendbuilder_missingUnlocks: (a: number) => [number, number, number, number];
  readonly spendbuilder_new: (a: any, b: number, c: number) => [number, number, number];
  readonly spendbuilder_seed: (a: number, b: any) => [number, number];
  readonly spendbuilder_sign: (a: number, b: number, c: number) => [number, number, number];
  readonly txbuilder_addPreimage: (a: number, b: number, c: number) => [number, number, number];
  readonly txbuilder_allNotes: (a: number) => [number, number, number];
  readonly txbuilder_allSpends: (a: number) => [number, number];
  readonly txbuilder_build: (a: number) => [number, number, number];
  readonly txbuilder_calcFee: (a: number) => any;
  readonly txbuilder_curFee: (a: number) => any;
  readonly txbuilder_fromTx: (a: any, b: number, c: number, d: number, e: number, f: any) => [number, number, number];
  readonly txbuilder_new: (a: any) => number;
  readonly txbuilder_recalcAndSetFee: (a: number, b: number) => [number, number];
  readonly txbuilder_setFeeAndBalanceRefund: (a: number, b: any, c: number, d: number) => [number, number];
  readonly txbuilder_sign: (a: number, b: number, c: number) => [number, number];
  readonly txbuilder_simpleSpend: (a: number, b: number, c: number, d: number, e: number, f: any, g: any, h: number, i: any, j: number) => [number, number];
  readonly txbuilder_spend: (a: number, b: number) => number;
  readonly txbuilder_validate: (a: number) => [number, number];
  readonly __wbg_intounderlyingsource_free: (a: number, b: number) => void;
  readonly intounderlyingsource_cancel: (a: number) => void;
  readonly intounderlyingsource_pull: (a: number, b: any) => any;
  readonly __wbg_intounderlyingbytesource_free: (a: number, b: number) => void;
  readonly __wbg_intounderlyingsink_free: (a: number, b: number) => void;
  readonly intounderlyingbytesource_autoAllocateChunkSize: (a: number) => number;
  readonly intounderlyingbytesource_cancel: (a: number) => void;
  readonly intounderlyingbytesource_pull: (a: number, b: any) => any;
  readonly intounderlyingbytesource_start: (a: number, b: any) => void;
  readonly intounderlyingbytesource_type: (a: number) => number;
  readonly intounderlyingsink_abort: (a: number, b: any) => any;
  readonly intounderlyingsink_close: (a: number) => any;
  readonly intounderlyingsink_write: (a: number, b: any) => any;
  readonly lockMetadataFromNoun: (a: any) => [number, number, number];
  readonly lockMetadataHash: (a: any) => any;
  readonly lockMetadataToNoun: (a: any) => any;
  readonly sourceFromNoun: (a: any) => [number, number, number];
  readonly sourceHash: (a: any) => any;
  readonly sourceToNoun: (a: any) => any;
  readonly witnessDataFromNoun: (a: any) => [number, number, number];
  readonly witnessDataToNoun: (a: any) => any;
  readonly haxFromNoun: (a: any) => [number, number, number];
  readonly haxHash: (a: any) => any;
  readonly haxToNoun: (a: any) => any;
  readonly lockMerkleProofFromNoun: (a: any) => [number, number, number];
  readonly lockMerkleProofHash: (a: any) => any;
  readonly lockMerkleProofToNoun: (a: any) => any;
  readonly lockPrimitiveFromNoun: (a: any) => [number, number, number];
  readonly lockPrimitiveHash: (a: any) => any;
  readonly lockPrimitiveToNoun: (a: any) => any;
  readonly lockRootFromNoun: (a: any) => [number, number, number];
  readonly lockRootHash: (a: any) => any;
  readonly lockRootToNoun: (a: any) => any;
  readonly nameFromNoun: (a: any) => [number, number, number];
  readonly nameHash: (a: any) => any;
  readonly nameToNoun: (a: any) => any;
  readonly noteV1FromNoun: (a: any) => [number, number, number];
  readonly noteV1Hash: (a: any) => any;
  readonly noteV1ToNoun: (a: any) => any;
  readonly pkhFromNoun: (a: any) => [number, number, number];
  readonly pkhHash: (a: any) => any;
  readonly pkhSignatureFromNoun: (a: any) => [number, number, number];
  readonly pkhSignatureHash: (a: any) => any;
  readonly pkhSignatureToNoun: (a: any) => any;
  readonly pkhToNoun: (a: any) => any;
  readonly seedV1FromNoun: (a: any) => [number, number, number];
  readonly seedV1Hash: (a: any) => any;
  readonly seedV1ToNoun: (a: any) => any;
  readonly seedsV1FromNoun: (a: any) => [number, number, number];
  readonly seedsV1Hash: (a: any) => any;
  readonly seedsV1ToNoun: (a: any) => any;
  readonly spendConditionFromNoun: (a: any) => [number, number, number];
  readonly spendConditionHash: (a: any) => any;
  readonly spendConditionToNoun: (a: any) => any;
  readonly timelockFromNoun: (a: any) => [number, number, number];
  readonly timelockHash: (a: any) => any;
  readonly timelockToNoun: (a: any) => any;
  readonly inputDisplayFromNoun: (a: any) => [number, number, number];
  readonly inputDisplayToNoun: (a: any) => any;
  readonly rawTxV0FromNoun: (a: any) => [number, number, number];
  readonly rawTxV0ToNoun: (a: any) => any;
  readonly timelockRangeFromNoun: (a: any) => [number, number, number];
  readonly timelockRangeHash: (a: any) => any;
  readonly timelockRangeToNoun: (a: any) => any;
  readonly balanceFromNoun: (a: any) => [number, number, number];
  readonly balanceToNoun: (a: any) => any;
  readonly balanceUpdateFromNoun: (a: any) => [number, number, number];
  readonly balanceUpdateToNoun: (a: any) => any;
  readonly inputFromNoun: (a: any) => [number, number, number];
  readonly inputHash: (a: any) => any;
  readonly inputToNoun: (a: any) => any;
  readonly inputsFromNoun: (a: any) => [number, number, number];
  readonly inputsHash: (a: any) => any;
  readonly inputsToNoun: (a: any) => any;
  readonly legacySignatureFromNoun: (a: any) => [number, number, number];
  readonly legacySignatureHash: (a: any) => any;
  readonly legacySignatureToNoun: (a: any) => any;
  readonly merkleProofFromNoun: (a: any) => [number, number, number];
  readonly merkleProofHash: (a: any) => any;
  readonly merkleProofToNoun: (a: any) => any;
  readonly nockchainTxFromNoun: (a: any) => [number, number, number];
  readonly nockchainTxToNoun: (a: any) => any;
  readonly noteDataFromNoun: (a: any) => [number, number, number];
  readonly noteDataHash: (a: any) => any;
  readonly noteDataToNoun: (a: any) => any;
  readonly noteFromNoun: (a: any) => [number, number, number];
  readonly noteHash: (a: any) => any;
  readonly noteToNoun: (a: any) => any;
  readonly noteV0FromNoun: (a: any) => [number, number, number];
  readonly noteV0Hash: (a: any) => any;
  readonly noteV0ToNoun: (a: any) => any;
  readonly rawTxV1FromNoun: (a: any) => [number, number, number];
  readonly rawTxV1ToNoun: (a: any) => any;
  readonly seedV0FromNoun: (a: any) => [number, number, number];
  readonly seedV0Hash: (a: any) => any;
  readonly seedV0ToNoun: (a: any) => any;
  readonly seedsV0FromNoun: (a: any) => [number, number, number];
  readonly seedsV0Hash: (a: any) => any;
  readonly seedsV0ToNoun: (a: any) => any;
  readonly sigFromNoun: (a: any) => [number, number, number];
  readonly sigHash: (a: any) => any;
  readonly sigToNoun: (a: any) => any;
  readonly spendV0FromNoun: (a: any) => [number, number, number];
  readonly spendV0Hash: (a: any) => any;
  readonly spendV0ToNoun: (a: any) => any;
  readonly spendV1FromNoun: (a: any) => [number, number, number];
  readonly spendV1Hash: (a: any) => any;
  readonly spendV1ToNoun: (a: any) => any;
  readonly spendsV1FromNoun: (a: any) => [number, number, number];
  readonly spendsV1Hash: (a: any) => any;
  readonly spendsV1ToNoun: (a: any) => any;
  readonly timelockIntentFromNoun: (a: any) => [number, number, number];
  readonly timelockIntentHash: (a: any) => any;
  readonly timelockIntentToNoun: (a: any) => any;
  readonly transactionDisplayFromNoun: (a: any) => [number, number, number];
  readonly transactionDisplayToNoun: (a: any) => any;
  readonly versionFromNoun: (a: any) => [number, number, number];
  readonly versionHash: (a: any) => any;
  readonly versionToNoun: (a: any) => any;
  readonly witnessFromNoun: (a: any) => [number, number, number];
  readonly witnessHash: (a: any) => any;
  readonly witnessToNoun: (a: any) => any;
  readonly noteInnerFromNoun: (a: any) => [number, number, number];
  readonly noteInnerHash: (a: any) => any;
  readonly noteInnerToNoun: (a: any) => any;
  readonly digestFromNoun: (a: any) => [number, number, number];
  readonly digestHash: (a: any) => any;
  readonly digestToNoun: (a: any) => any;
  readonly wasm_bindgen__convert__closures_____invoke__h442fd485655303f8: (a: number, b: number, c: any) => void;
  readonly wasm_bindgen__closure__destroy__ha41a55c5a893774a: (a: number, b: number) => void;
  readonly wasm_bindgen__convert__closures_____invoke__h48529c1d955b566f: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __externref_drop_slice: (a: number, b: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

export type TxId = string;
export type BlockHeight = number;
export type LockTim = Timelock;
