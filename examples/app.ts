import { NockchainProvider, wasm } from '../src/index';

const statusDiv = document.getElementById('status')!;
const outputPre = document.getElementById('output')!;
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const signRawTxBtn = document.getElementById('signRawTxBtn') as HTMLButtonElement;
const recipientInput = document.getElementById('recipientInput') as HTMLInputElement;

let provider: NockchainProvider;
let grpcEndpoint: string | null = null;
let walletPkh: string | null = null;

function log(msg: string) {
  outputPre.textContent += msg + '\n';
  console.log(msg);
}

async function init() {
  try {
    await wasm.default();
    log('WASM initialized');

    // Initialize NockchainProvider
    provider = new NockchainProvider();
    log('NockchainProvider initialized');
  } catch (e) {
    log('Failed to init: ' + e);
  }
}

connectBtn.onclick = async () => {
  if (!provider) {
    log('Provider not initialized');
    return;
  }
  try {
    // Connect to wallet (returns pkh and grpcEndpoint)
    const info = await provider.connect();
    grpcEndpoint = info.grpcEndpoint;
    walletPkh = info.pkh;

    statusDiv.textContent = 'Connected: ' + walletPkh;
    signRawTxBtn.disabled = false;
    log('Connected: ' + walletPkh + ' @ ' + grpcEndpoint);
  } catch (e: any) {
    log('Connect failed: ' + e.message);
  }
};

signRawTxBtn.onclick = async () => {
  try {
    log('Building transaction...');

    // 1. Validate inputs
    if (!grpcEndpoint || !walletPkh) {
      log('Please connect and get wallet info first');
      return;
    }

    const recipient = recipientInput.value.trim();
    if (!recipient) {
      log('Please enter a recipient address');
      return;
    }

    // 2. Create gRPC client
    log('Creating gRPC client for: ' + grpcEndpoint);
    const grpcClient = new wasm.GrpcClient(grpcEndpoint);

    // 3. Derive first-name from PKH and query notes (notes are indexed by first-name, not address)
    const spendCondition = [{ Pkh: { m: 1, hashes: [walletPkh] } }] as wasm.SpendCondition;
    const firstName = wasm.spendConditionFirstName(spendCondition);
    log('Querying notes by first-name...');
    const balance = await grpcClient.getBalanceByFirstName(firstName);

    if (!balance || !balance.notes || balance.notes.length === 0) {
      log('No notes found - wallet might be empty');
      return;
    }

    log('Found ' + balance.notes.length + ' notes');

    // Convert notes from protobuf (0.2: free function)
    const notes = balance.notes
      .map((entry: any) => entry.note)
      .filter(Boolean)
      .map((noteProto: any) => wasm.note_from_protobuf(noteProto));

    if (!notes.length) {
      log('No parseable notes found');
      return;
    }

    const note = notes[0];
    const noteAssets = note.assets;
    log('Using note with ' + noteAssets + ' nicks');

    // 4. Build transaction (send 10 NOCK = 655360 nicks)
    const TEN_NOCK_IN_NICKS = String(10 * 65536);
    const feePerWord = '32768'; // 0.5 NOCK per word

    log('Building transaction to send 10 NOCK...');
    const builder = new wasm.TxBuilder({
      tx_engine_version: 1,
      tx_engine_patch: 0,
      min_fee: '256',
      cost_per_word: feePerWord,
      witness_word_div: 1,
    });

    // Use simpleSpend (no lockData for lower fees), digest values are strings in 0.2
    builder.simpleSpend(
      [note],
      [spendCondition],
      recipient,
      TEN_NOCK_IN_NICKS,
      null, // fee_override (let it auto-calculate)
      walletPkh,
      false // include_lock_data
    );

    // 5. Build the transaction and get notes/spend conditions
    log('Building raw transaction...');
    const nockchainTx = builder.build();
    const txId = nockchainTx.id;
    log('Transaction ID: ' + txId);

    // Get notes and spend conditions from builder
    const txNotes = builder.allNotes();

    log('Notes count: ' + txNotes.notes.length);
    log('Spend conditions count: ' + txNotes.spend_conditions.length);

    // 6. Convert to protobuf (API boundary requires protobuf)
    const rawTx = wasm.nockchainTxToRaw(nockchainTx) as wasm.RawTxV1;
    const rawTxProto = wasm.rawTxToProtobuf(rawTx);
    const notesProto = txNotes.notes.map((n: wasm.Note) => wasm.note_to_protobuf(n));
    const spendCondProto = txNotes.spend_conditions.map((sc: wasm.SpendCondition) =>
      wasm.spendConditionToProtobuf(sc)
    );

    // 7. Sign using provider.signRawTx
    log('Signing transaction...');
    const signedTxProtobuf = await provider.signRawTx({
      rawTx: rawTxProto,
      notes: notesProto,
      spendConditions: spendCondProto,
    });

    log('Transaction signed successfully!');

    // 8. Convert signed tx to Jam and download
    const signedTxProto =
      typeof signedTxProtobuf === 'object' && !(signedTxProtobuf instanceof Uint8Array)
        ? signedTxProtobuf
        : (signedTxProtobuf as unknown as wasm.PbCom2RawTransaction);
    const signedRawTx = wasm.rawTxFromProtobuf(signedTxProto);
    const jamBytes = wasm.jam(signedRawTx as unknown as wasm.Noun);
    const blob = new Blob([new Uint8Array(jamBytes)], { type: 'application/jam' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${txId}.tx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    log('Downloaded signed transaction (Jam): ' + txId + '.tx');
  } catch (e: any) {
    log('Error: ' + e.message);
    console.error(e);
  }
};

init();
