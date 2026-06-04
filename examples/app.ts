import { NockchainProvider, getLatestTxEngineSettings, wasm } from '../src/index';

const statusDiv = document.getElementById('status')!;
const outputPre = document.getElementById('output')!;
const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const signRawTxBtn = document.getElementById('signRawTxBtn') as HTMLButtonElement;
const recipientInput = document.getElementById('recipientInput') as HTMLInputElement;

let provider: NockchainProvider;
let grpcEndpoint: string | null = null;
let walletPkh: string | null = null;
let txEngineSettings = getLatestTxEngineSettings();

function asDigest(value: string): wasm.Digest {
  return value as wasm.Digest;
}

function asNicks(value: string): wasm.Nicks {
  return value as wasm.Nicks;
}

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
    // Connect to wallet
    const info = await provider.connect();
    grpcEndpoint = info.rpcConfig.rpcUrl;
    walletPkh = info.account.address;
    txEngineSettings = getLatestTxEngineSettings(info.rpcConfig.txEngineActivationHeights);

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
    const spendCondition: wasm.SpendCondition = [
      { tag: 'pkh', m: 1, hashes: [asDigest(walletPkh)] },
    ];
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
      .map((noteProto: wasm.PbCom2Note) => wasm.noteFromProtobuf(noteProto));

    if (!notes.length) {
      log('No parseable notes found');
      return;
    }

    const note = notes[0];
    const noteAssets = note.assets;
    log('Using note with ' + noteAssets + ' nicks');

    // 4. Build transaction (send 10 NOCK = 655360 nicks)
    const TEN_NOCK_IN_NICKS = asNicks(String(10 * 65536));

    log('Building transaction to send 10 NOCK...');
    const builder = new wasm.TxBuilder(txEngineSettings);

    // Use simpleSpend (no lockData for lower fees), digest values are strings in 0.2
    builder.simpleSpend(
      [note],
      [spendCondition as unknown as wasm.TxLock],
      asDigest(recipient),
      TEN_NOCK_IN_NICKS,
      null, // fee_override (let it auto-calculate)
      asDigest(walletPkh),
      false // include_lock_data
    );

    // 5. Build the transaction and get notes/spend conditions
    log('Building raw transaction...');
    const nockchainTx = builder.build();
    const txId = nockchainTx.id;
    log('Transaction ID: ' + txId);

    // 6. Sign using provider.signTx
    log('Signing transaction...');
    const signed = await provider.signTx(nockchainTx);

    log('Transaction signed successfully!');

    // 7. Convert signed tx to Jam and download
    const signedRawTx = wasm.nockchainTxToRawTx(signed.tx as any);
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
