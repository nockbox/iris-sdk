import { NockchainProvider, wasm } from '../src/index';

// ===== Types =====
// Note: Nicks are strings in current WASM version, so they need to be cast into integers for arithmetic

interface Lock {
  id: string;
  name: string;
  spendCondition: wasm.SpendCondition; // plain array, e.g. [{ Pkh: { m: 1, hashes: [pkh] } }]
  expanded: boolean;
}

interface NoteData {
  note: wasm.Note;
  assets: wasm.Nicks;
  firstName: string;
  lastName: string;
}

interface SelectedInput {
  lockId: string;
  note: NoteData;
  id: string; // unique identifier
}

interface Seed {
  lockId: string;
  amount: wasm.Nicks;
}

interface Spend {
  inputId: string;
  input: SelectedInput;
  fee: wasm.Nicks;
  seeds: Seed[];
}

// ===== State =====

const state = {
  // Connection
  connected: false,
  walletPkh: null as string | null,
  grpcEndpoint: null as string | null,
  provider: null as NockchainProvider | null,
  grpcClient: null as wasm.GrpcClient | null,

  // Locks & Notes
  locks: [] as Lock[],
  notes: new Map<string, NoteData[]>(), // lockId -> notes

  // Transaction Building
  selectedInputs: [] as SelectedInput[],
  spends: [] as Spend[],
  builder: null as wasm.TxBuilder | null,

  // Unlocking
  preimages: new Map<string, Uint8Array>(), // hash -> jam bytes
  missingUnlocks: [] as any[], // Missing type definition in WASM module

  // Transaction
  nockchainTx: null as wasm.NockchainTx | null,
  signedTx: null as wasm.NockchainTx | null,
  signedTxId: null as string | null,
};

// ===== DOM Elements =====

const connectBtn = document.getElementById('connectBtn') as HTMLButtonElement;
const addLockBtn = document.getElementById('addLockBtn') as HTMLButtonElement;
const refreshAllBtn = document.getElementById('refreshAllBtn') as HTMLButtonElement;
const lockList = document.getElementById('lockList')!;
const spendsList = document.getElementById('spendsList')!;
const preimagesList = document.getElementById('preimagesList')!;
const unlocksList = document.getElementById('unlocksList')!;
const txValidation = document.getElementById('txValidation')!;
const txInfo = document.getElementById('txInfo')!;
const outputsList = document.getElementById('outputsList')!;
const downloadTxBtn = document.getElementById('downloadTxBtn') as HTMLButtonElement;
const signTxBtn = document.getElementById('signTxBtn') as HTMLButtonElement;
const signedTxSection = document.getElementById('signedTxSection') as HTMLElement;
const signedTxIdEl = document.getElementById('signedTxId') as HTMLElement;

const addLockModal = document.getElementById('addLockModal')!;
const closeLockModal = document.getElementById('closeLockModal')!;
const lockNameInput = document.getElementById('lockNameInput') as HTMLInputElement;
const primitivesContainer = document.getElementById('primitivesContainer')!;
const addPrimitiveBtn = document.getElementById('addPrimitiveBtn') as HTMLButtonElement;
const confirmAddLockBtn = document.getElementById('confirmAddLockBtn') as HTMLButtonElement;
const cancelAddLockBtn = document.getElementById('cancelAddLockBtn') as HTMLButtonElement;
const importLocksBtn = document.getElementById('importLocksBtn') as HTMLButtonElement;
const exportLocksBtn = document.getElementById('exportLocksBtn') as HTMLButtonElement;

const addPreimageBtn = document.getElementById('addPreimageBtn') as HTMLButtonElement;
const addPreimageModal = document.getElementById('addPreimageModal')!;
const closePreimageModal = document.getElementById('closePreimageModal')!;
const preimageFileInput = document.getElementById('preimageFileInput') as HTMLInputElement;
const addPreimageConfirmBtn = document.getElementById('addPreimageConfirmBtn') as HTMLButtonElement;
const cancelPreimageBtn = document.getElementById('cancelPreimageBtn') as HTMLButtonElement;

// ===== Utilities =====

function truncateAddress(addr: string | undefined): string {
  if (!addr) return '';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function nicksToNock(nicks: wasm.Nicks): number {
  return Number(BigInt(nicks)) / 65536;
}

function nockToNicks(nock: number): wasm.Nicks {
  return String(BigInt(Math.floor(nock * 65536)));
}

function formatNock(nock: number): string {
  return nock.toFixed(4);
}

declare global {
  interface Window {
    copyToClipboard: (text: string, element: HTMLElement) => void;
  }
}

// Add to window object
window.copyToClipboard = (text: string, element: HTMLElement) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const tooltip = document.createElement('span');
      tooltip.textContent = 'Copied!';
      tooltip.style.cssText = `
            position: absolute;
            top: -25px;
            right: 0;
            background: #10b981;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            pointer-events: none;
            animation: fadeOut 1s forwards;
            animation-delay: 1s;
            z-index: 100;
        `;
      element.appendChild(tooltip);
      setTimeout(() => {
        if (tooltip.parentNode === element) {
          element.removeChild(tooltip);
        }
      }, 2000);
    })
    .catch(err => console.error('Failed to copy:', err));
};

function renderNoteName(firstName: string, lastName: string, bright: boolean = false): string {
  const fullName = `[ ${firstName} ${lastName} ]`;
  const truncatedName = `[ ${firstName.slice(0, 4)}...${lastName.slice(-4)} ]`;
  // Escape quotes for HTML attribute
  const escapedFullName = fullName.replace(/"/g, '&quot;').replace(/'/g, "\\'");

  const color = bright ? '#e0e0e0' : '#9ca3af';
  const weight = bright ? '600' : 'normal';

  return `
        <span 
            class="font-mono cursor-pointer hover:opacity-80 transition-opacity relative group" 
            style="color: ${color}; font-weight: ${weight}; font-family: monospace; position: relative;"
            onclick="window.copyToClipboard('${escapedFullName}', this)"
            title="Click to copy: ${escapedFullName}"
        >
            ${truncatedName}
        </span>
    `;
}

function renderCopyableId(id: string, label: string = 'ID'): string {
  const truncated = `${id.substring(0, 16)}...`;
  return `
        <span 
            class="font-mono cursor-pointer hover:opacity-80 transition-opacity relative group" 
            style="font-family: monospace; font-size: 0.75rem; position: relative;"
            onclick="window.copyToClipboard('${id}', this)"
            title="Click to copy full ${label}"
        >
            ${truncated}
        </span>
    `;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// ===== Initialization =====

async function init() {
  try {
    await wasm.default();
    console.log('WASM initialized');

    state.provider = new NockchainProvider();
    console.log('NockchainProvider initialized');

    // Create default locks
    createDefaultLocks();
    renderLocks();
  } catch (e) {
    console.error('Failed to init:', e);
    alert('Failed to initialize WASM');
  }
}

function createDefaultLocks() {
  // We'll create default locks after wallet connects
  // For now, just initialize empty
}

// ===== Connection =====

connectBtn.onclick = async () => {
  if (!state.provider) {
    alert('Provider not initialized');
    return;
  }

  try {
    const info = await state.provider.connect();
    state.grpcEndpoint = info.grpcEndpoint;
    state.walletPkh = info.pkh;
    state.connected = true;

    connectBtn.textContent = truncateAddress(state.walletPkh);
    console.log('Connected:', state.walletPkh);

    // Create gRPC client
    state.grpcClient = new wasm.GrpcClient(state.grpcEndpoint);

    // Create default locks now that we have wallet PKH
    createDefaultLocksWithPkh();
    renderLocks();
  } catch (e) {
    console.error('Connect failed:', e);
    alert('Failed to connect: ' + (e instanceof Error ? e.message : String(e)));
  }
};

function createDefaultLocksWithPkh() {
  if (!state.walletPkh) return;

  // Check if default locks already exist to prevent duplicates
  const pkhDefaultExists = state.locks.some(l => l.id === 'pkh-default');
  const coinbaseDefaultExists = state.locks.some(l => l.id === 'coinbase-default');

  if (!pkhDefaultExists) {
    // Simple 1-of-1 PKH lock
    const pkhPrim: wasm.LockPrimitive = { Pkh: { m: 1, hashes: [state.walletPkh] } };
    const spendCondition: wasm.SpendCondition = [pkhPrim];
    state.locks.push({
      id: 'pkh-default',
      name: 'Wallet PKH',
      spendCondition,
      expanded: false,
    });
  }

  if (!coinbaseDefaultExists) {
    // Coinbase lock (PKH + timelock)
    const pkhPrim: wasm.LockPrimitive = { Pkh: { m: 1, hashes: [state.walletPkh] } };
    const coinbaseTim: wasm.LockTim = {
      rel: { min: 100, max: undefined },
      abs: { min: undefined, max: undefined },
    };
    const timPrim: wasm.LockPrimitive = { Tim: coinbaseTim };
    const spendCondition: wasm.SpendCondition = [pkhPrim, timPrim];
    state.locks.push({
      id: 'coinbase-default',
      name: 'Wallet Coinbase',
      spendCondition,
      expanded: false,
    });
  }
}

// ===== Lock Management =====

function renderLocks() {
  lockList.innerHTML = '';

  if (state.locks.length === 0) {
    lockList.innerHTML =
      '<div class="empty-state">No locks defined. Add a lock to get started.</div>';
    return;
  }

  state.locks.forEach(lock => {
    const lockEl = document.createElement('div');
    const lockHtml = `
            <div class="lock-item">
                <div class="lock-header" data-lock-id="${lock.id}">
                    <div class="lock-title">${lock.name}</div>
                    <div class="lock-actions">
                        <button class="btn btn-sm" data-action="refresh" data-lock-id="${lock.id}">↻</button>
                        <button class="btn btn-danger btn-sm" data-action="remove" data-lock-id="${lock.id}">×</button>
                    </div>
                </div>
                <div class="note-list ${lock.expanded ? '' : 'hidden'}" data-lock-id="${lock.id}">
                    <div style="padding: 1rem; text-align: center; color: #6b7280; font-size: 0.75rem">Loading...</div>
                </div>
            </div>
        `;
    lockEl.innerHTML = lockHtml;
    lockList.appendChild(lockEl);
  });

  // Re-render notes for expanded locks
  state.locks
    .filter(l => l.expanded)
    .forEach(lock => {
      renderNotesForLock(lock.id);
    });
}

async function refreshNotesForLock(lockId: string) {
  const lock = state.locks.find(l => l.id === lockId);
  if (!lock || !state.grpcClient) return;

  try {
    // 0.2: first name = hash of spend condition (Digest string)
    const firstName = wasm.spendConditionHash(lock.spendCondition);
    console.log(`Fetching notes for lock ${lockId}, firstName: ${firstName.substring(0, 20)}...`);

    const balance = await state.grpcClient.getBalanceByFirstName(firstName);

    if (!balance || !balance.notes || balance.notes.length === 0) {
      state.notes.set(lockId, []);
      renderNotesForLock(lockId);
      return;
    }

    const notes: NoteData[] = balance.notes
      .map((entry: wasm.PbCom2BalanceEntry) => entry.note)
      .filter((note): note is wasm.PbCom2Note => note != null)
      .map((noteProto: wasm.PbCom2Note) => {
        const note = wasm.note_from_protobuf(noteProto);
        const assets = note.assets != null ? String(note.assets) : '0';
        const firstNameStr = note.name?.first ?? '';
        const lastNameStr = note.name?.last ?? '';
        return {
          note,
          assets,
          firstName: firstNameStr,
          lastName: lastNameStr,
        };
      });

    state.notes.set(lockId, notes);
    renderNotesForLock(lockId);
  } catch (e) {
    console.error('Failed to fetch notes:', e);
  }
}

function renderNotesForLock(lockId: string) {
  const notesContainer = document.querySelector(
    `.note-list[data-lock-id="${lockId}"]`
  ) as HTMLElement;
  if (!notesContainer) return;

  const notes = state.notes.get(lockId) || [];
  if (notes.length === 0) {
    notesContainer.innerHTML =
      '<div class="empty-state" style="padding: 1rem">No notes found</div>';
    return;
  }

  notesContainer.innerHTML = notes
    .map(
      (note, index) => `
    <div class="note-item">
      <div class="note-info">
        <div class="note-amount">${formatNock(nicksToNock(note.assets))} NOCK</div>
        <div style="font-size: 0.7rem">${renderNoteName(note.firstName, note.lastName)}</div>
      </div>
      <button class="btn btn-sm" data-action="select-note" data-lock-id="${lockId}" data-note-index="${index}">+</button>
    </div>
  `
    )
    .join('');
}

async function refreshAllNotes() {
  for (const lock of state.locks) {
    await refreshNotesForLock(lock.id);
  }
}

function removeLock(lockId: string) {
  state.locks = state.locks.filter(l => l.id !== lockId);
  state.notes.delete(lockId);
  // Also remove any selected inputs from this lock
  state.selectedInputs = state.selectedInputs.filter(input => input.lockId !== lockId);
  state.spends = state.spends.filter(spend => spend.input.lockId !== lockId);
  renderLocks();
  renderSpends(); // Re-render spends as some might have been removed
  updateBuilder(); // Rebuild transaction if inputs changed
}

// ===== Spend Management =====

function addInputToSpend(lockId: string, noteIndex: number) {
  const notes = state.notes.get(lockId);
  if (!notes || !notes[noteIndex]) return;

  const input: SelectedInput = {
    lockId,
    note: notes[noteIndex],
    id: generateId(),
  };

  state.selectedInputs.push(input);

  const spend: Spend = {
    inputId: input.id,
    input,
    fee: '0',
    seeds: [],
  };

  state.spends.push(spend);
  renderSpends();
  updateBuilder();
}

function renderSpends() {
  if (state.spends.length === 0) {
    spendsList.innerHTML =
      '<div class="empty-state">Select input notes from the left panel to start building a transaction</div>';
    return;
  }

  spendsList.innerHTML = state.spends
    .map(
      spend => `
    <div class="spend-item ${isSpendBalanced(spend) ? 'spend-balanced' : 'spend-unbalanced'}">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem">
        <div style="font-weight: 600">${renderNoteName(spend.input.note.firstName, spend.input.note.lastName, true)}</div>
        <button class="btn btn-danger btn-sm" data-action="remove-spend" data-input-id="${spend.input.id}">Remove Spend</button>
      </div>
      <div style="font-weight: 600; margin-bottom: 0.25rem">Input: ${formatNock(nicksToNock(spend.input.note.assets))} NOCK</div>
      <div style="font-size: 0.75rem; color: #9ca3af">${spend.input.lockId}</div>
      
      <div class="form-group">
        <label class="form-label">Fee (NOCK)</label>
        <input type="number" class="input" step="0.0001" value="${nicksToNock(spend.fee)}" 
          data-action="update-fee" data-input-id="${spend.inputId}" />
      </div>

      <div style="margin-top: 0.75rem">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem">
          <span class="form-label" style="margin: 0">Seeds</span>
          <button class="btn btn-sm" data-action="add-seed" data-input-id="${spend.inputId}">+</button>
        </div>
        ${renderSeeds(spend)}
      </div>

      <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #333">
        <div style="font-size: 0.75rem; color: #9ca3af">Balance: ${getSpendBalanceText(spend)}</div>
      </div>
    </div>
  `
    )
    .join('');
}

function renderSeeds(spend: Spend): string {
  if (spend.seeds.length === 0) {
    return '<div style="font-size: 0.75rem; color: #6b7280">No seeds</div>';
  }

  return spend.seeds
    .map(
      (seed, index) => `
    <div class="seed-item">
      <select class="input" style="flex: 1" data-action="update-seed-lock" data-input-id="${spend.inputId}" data-seed-index="${index}">
        ${state.locks.map(l => `<option value="${l.id}" ${l.id === seed.lockId ? 'selected' : ''}>${l.name}</option>`).join('')}
      </select>
      <input type="number" class="input" style="width: 120px" step="0.0001" value="${nicksToNock(seed.amount)}"
        data-action="update-seed-amount" data-input-id="${spend.inputId}" data-seed-index="${index}" />
      <button class="btn btn-sm" data-action="balance-seed" data-input-id="${spend.inputId}" data-seed-index="${index}" title="Balance remaining">⚖</button>
      <button class="btn btn-danger btn-sm" data-action="remove-seed" data-input-id="${spend.inputId}" data-seed-index="${index}">×</button>
    </div>
  `
    )
    .join('');
}

function isSpendBalanced(spend: Spend): boolean {
  const total =
    BigInt(spend.fee) + spend.seeds.reduce((sum, seed) => sum + BigInt(seed.amount), BigInt(0));
  return total === BigInt(spend.input.note.assets);
}

function getSpendBalanceText(spend: Spend): string {
  const total =
    BigInt(spend.fee) + spend.seeds.reduce((sum, seed) => sum + BigInt(seed.amount), BigInt(0));
  const diff = BigInt(spend.input.note.assets) - total;
  if (diff === BigInt(0)) {
    return `✓ Balanced (${formatNock(nicksToNock(String(total)))} NOCK)`;
  }
  const sign = diff > 0n ? '+' : '';
  return `${sign}${formatNock(nicksToNock(String(diff)))} NOCK`;
}

function removeSpend(inputId: string) {
  const index = state.spends.findIndex(s => s.inputId === inputId);
  if (index >= 0) {
    state.spends.splice(index, 1);

    // Also remove from selectedInputs
    const selectedIndex = state.selectedInputs.findIndex(i => i.id === inputId);
    if (selectedIndex >= 0) {
      state.selectedInputs.splice(selectedIndex, 1);
    }

    renderSpends();
    updateBuilder();
  }
}

function balanceSeed(inputId: string, seedIndex: number) {
  const spend = state.spends.find(s => s.inputId === inputId);
  if (!spend) return;

  const seed = spend.seeds[seedIndex];
  if (!seed) return;

  const inputAssets = BigInt(spend.input.note.assets);
  const fee = BigInt(spend.fee);

  let otherSeedsTotal = BigInt(0);
  for (let i = 0; i < spend.seeds.length; i++) {
    if (i !== seedIndex) {
      otherSeedsTotal += BigInt(spend.seeds[i].amount);
    }
  }
  // Calculate remaining assets
  const remaining = inputAssets - fee - otherSeedsTotal;

  if (remaining < 0n) {
    alert('Insufficient funds to balance this seed. Please reduce fee or other seeds.');
    return;
  }

  seed.amount = String(remaining);
  renderSpends();
  updateBuilder();
}

function updateSpendFee(inputId: string, feeStr: string, shouldRender: boolean = true) {
  const spend = state.spends.find(s => s.inputId === inputId);
  if (spend) {
    try {
      // Convert NOCK to nicks
      const nock = parseFloat(feeStr);
      if (!isNaN(nock) && nock >= 0) {
        spend.fee = nockToNicks(nock);
      } else {
        spend.fee = '0';
      }
      if (shouldRender) renderSpends();
      updateBuilder();
    } catch (e) {
      console.error('Invalid fee', e);
    }
  }
}

function addSeed(inputId: string) {
  const spend = state.spends.find(s => s.inputId === inputId);
  if (spend && state.locks.length > 0) {
    spend.seeds.push({
      lockId: state.locks[0].id,
      amount: '0',
    });
    renderSpends();
    updateBuilder();
  }
}

function updateSeedLock(inputId: string, seedIndex: number, lockId: string) {
  const spend = state.spends.find(s => s.inputId === inputId);
  if (spend && spend.seeds[seedIndex]) {
    spend.seeds[seedIndex].lockId = lockId;
    renderSpends();
    updateBuilder();
  }
}

function updateSeedAmount(
  inputId: string,
  seedIndex: number,
  amountStr: string,
  shouldRender = true
) {
  const spend = state.spends.find(s => s.inputId === inputId);
  if (spend && spend.seeds[seedIndex]) {
    try {
      // Convert NOCK to nicks
      const nock = parseFloat(amountStr);
      if (!isNaN(nock) && nock >= 0) {
        spend.seeds[seedIndex].amount = nockToNicks(nock);
      } else {
        spend.seeds[seedIndex].amount = '0';
      }
      if (shouldRender) renderSpends();
      updateBuilder();
    } catch (e) {
      console.error('Invalid amount', e);
    }
  }
}

function removeSeed(inputId: string, seedIndex: number) {
  const spend = state.spends.find(s => s.inputId === inputId);
  if (spend) {
    spend.seeds.splice(seedIndex, 1);
    renderSpends();
    updateBuilder();
  }
}

// ===== Transaction Builder =====

function updateBuilder() {
  const allBalanced = state.spends.length > 0 && state.spends.every(isSpendBalanced);

  if (!allBalanced) {
    state.builder = null;
    state.nockchainTx = null;
    state.missingUnlocks = [];
    state.signedTx = null; // Clear signed TX state
    state.signedTxId = null;
    signedTxSection.classList.add('hidden');
    renderUnlocks();
    renderTransaction();
    return;
  }

  try {
    console.log('Building transaction...');

    const txSettings: wasm.TxEngineSettings = {
      tx_engine_version: 1,
      tx_engine_patch: 0,
      min_fee: '256',
      cost_per_word: '32768',
      witness_word_div: 1,
    };
    const builder = new wasm.TxBuilder(txSettings);

    for (const spend of state.spends) {
      const lock = state.locks.find(l => l.id === spend.input.lockId);
      if (!lock) continue;

      const refundLock: wasm.SpendCondition | null =
        spend.seeds.length > 0
          ? (state.locks.find(l => l.id === spend.seeds[0].lockId)?.spendCondition ?? null)
          : lock.spendCondition;

      const spendBuilder = new wasm.SpendBuilder(
        spend.input.note.note,
        lock.spendCondition,
        refundLock
      );

      for (const seed of spend.seeds) {
        const seedLock = state.locks.find(l => l.id === seed.lockId);
        if (seedLock) {
          const seedV1: wasm.SeedV1 = {
            output_source: undefined,
            lock_root: { Lock: seedLock.spendCondition },
            note_data: [],
            gift: seed.amount,
            parent_hash: wasm.note_hash(spend.input.note.note),
          };
          spendBuilder.seed(seedV1);
        }
      }

      if (BigInt(spend.fee) > 0n) {
        spendBuilder.fee(spend.fee);
      }

      spendBuilder.computeRefund(false);
      builder.spend(spendBuilder);
    }

    // Try to build the transaction
    state.builder = builder;

    // Apply preimages to the builder
    applyAllPreimages(builder);

    // Get missing unlocks
    state.missingUnlocks = getMissingUnlocks(builder);

    // Try to build raw tx
    try {
      state.nockchainTx = builder.build();
    } catch (e) {
      console.log('Cannot build yet - missing unlocks:', e);
      state.nockchainTx = null;
    }

    // Clear signed TX state as builder changed
    state.signedTx = null;
    state.signedTxId = null;
    signedTxSection.classList.add('hidden');

    renderUnlocks();
    renderTransaction();
  } catch (e) {
    console.error('Failed to build transaction:', e);
    state.builder = null;
    state.nockchainTx = null;
    state.missingUnlocks = [];
    state.signedTx = null; // Clear signed TX state
    state.signedTxId = null;
    signedTxSection.classList.add('hidden');
    renderUnlocks();
    renderTransaction();
  }
}

function applyAllPreimages(builder: wasm.TxBuilder) {
  for (const [hash, jam] of state.preimages) {
    try {
      builder.addPreimage(jam);
    } catch (e) {
      // Ignore errors applying preimages
    }
  }
}

function getMissingUnlocks(builder: wasm.TxBuilder): any[] {
  const spends = builder.allSpends();
  const allMissing: any[] = [];
  const seen = new Set<string>();

  for (const spend of spends) {
    // Get missing unlocks
    const missing = spend.missingUnlocks();
    for (const unlock of missing) {
      // Simple dedup based on JSON stringification
      const key = JSON.stringify(unlock);
      if (!seen.has(key)) {
        seen.add(key);
        allMissing.push(unlock);
      }
    }

    spend.free();
  }

  return allMissing;
}

function applyPreimages() {
  if (!state.builder) return;

  // Apply preimages to builder
  applyAllPreimages(state.builder);

  // Refresh missing unlocks
  state.missingUnlocks = getMissingUnlocks(state.builder);

  // Try to build again
  try {
    state.nockchainTx = state.builder.build();
  } catch (e) {
    state.nockchainTx = null;
  }

  // Clear signed TX state as builder changed
  state.signedTx = null;
  state.signedTxId = null;
  signedTxSection.classList.add('hidden');
}

// ===== Preimage Management =====

function renderPreimages() {
  if (state.preimages.size === 0) {
    preimagesList.innerHTML = '<div style="font-size: 0.75rem; color: #6b7280">No preimages</div>';
    return;
  }

  preimagesList.innerHTML = Array.from(state.preimages.entries())
    .map(
      ([hash, _]) => `
    <div class="preimage-item">
      <span>${hash.substring(0, 16)}...</span>
      <button class="btn btn-danger btn-sm" data-action="remove-preimage" data-hash="${hash}">×</button>
    </div>
  `
    )
    .join('');
}

async function addPreimageFromFile() {
  const file = preimageFileInput.files?.[0];
  if (!file) {
    alert('Please select a file');
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const jamBytes = new Uint8Array(arrayBuffer);

    // Hash the noun to get the key
    const hash = wasm.hashNoun(jamBytes);
    const hashString = hash;

    // Store the preimage
    state.preimages.set(hashString, jamBytes);

    // Clear input and close modal
    preimageFileInput.value = '';
    addPreimageModal.className = 'modal';

    renderPreimages();
    updateBuilder(); // Re-apply preimages
  } catch (e) {
    console.error('Failed to add preimage:', e);
    alert('Failed to add preimage: ' + (e as Error).message);
  }
}

// ===== Unlocks & Outputs =====

function renderUnlocks() {
  if (state.missingUnlocks.length === 0) {
    unlocksList.innerHTML =
      '<div style="font-size: 0.75rem; color: #6b7280">No missing unlocks</div>';
    return;
  }

  const unlocksHtml = state.missingUnlocks
    .map((unlock: any) => {
      // Check the type of unlock
      if (unlock.Pkh) {
        const sigOf = Array.from(unlock.Pkh.sig_of || []) as string[];
        const needsOurSig = sigOf.includes(state.walletPkh || '');
        return `
        <div class="unlock-item unlock-pkh">
          <div style="font-weight: 600; margin-bottom: 0.25rem">PKH Signature</div>
          <div style="font-size: 0.75rem; color: #9ca3af">
            Needs ${unlock.Pkh.num_sigs} signature(s)
            ${needsOurSig ? '<br><span style="color: #3b82f6">⚠ Needs us to sign</span>' : ''}
          </div>
          ${sigOf.length > 0 ? `<div style="font-size: 0.7rem; color: #6b7280; margin-top: 0.25rem">Sign of: ${sigOf.map((s: string) => s.substring(0, 8) + '...').join(', ')}</div>` : ''}
        </div>
      `;
      } else if (unlock.Hax) {
        const preimagesFor = Array.from(unlock.Hax.preimages_for || []) as string[];
        return `
        <div class="unlock-item unlock-hax">
          <div style="font-weight: 600; margin-bottom: 0.25rem">Hash Preimages</div>
          <div style="font-size: 0.75rem; color: #9ca3af">
            Missing preimages for:
          </div>
          ${preimagesFor.map((hash: string) => `<div style="font-size: 0.7rem; font-family: monospace; margin-top: 0.25rem">${hash.substring(0, 16)}...</div>`).join('')}
        </div>
      `;
      } else if (unlock.Brn !== undefined) {
        return `
        <div class="unlock-item unlock-brn">
          <div style="font-weight: 600; margin-bottom: 0.25rem">Permanently Locked</div>
          <div style="font-size: 0.75rem; color: #dc2626">
            This condition is permanently locked (burn)
          </div>
        </div>
      `;
      }
      return '';
    })
    .join('');

  unlocksList.innerHTML =
    unlocksHtml || '<div style="font-size: 0.75rem; color: #6b7280">Unknown unlock type</div>';
}

function renderTransaction() {
  if (!state.builder || !state.nockchainTx) {
    txValidation.innerHTML = '';
    txInfo.innerHTML = '';
    outputsList.innerHTML = '';
    downloadTxBtn.disabled = true;
    signTxBtn.disabled = true;
    signedTxSection.classList.add('hidden'); // Ensure signed section is hidden
    return;
  }

  try {
    let isValid = true;
    let validationError = '';

    try {
      state.builder.validate();
    } catch (e) {
      isValid = false;
      // Handle different error types - WASM might throw strings or Error objects
      if (e instanceof Error) {
        validationError = e.message;
      } else if (typeof e === 'string') {
        validationError = e;
      } else {
        validationError = String(e);
      }
    }

    const feeStr = state.builder.curFee();
    const calcFeeStr = state.builder.calcFee();
    const fee = BigInt(feeStr);
    const calcFee = BigInt(calcFeeStr);
    const feeSufficient = fee >= calcFee;

    // If validate() failed, it might be due to fee or missing unlocks.
    // We'll show the specific error if validate failed.

    txValidation.innerHTML = `
      <div class="validation-status ${isValid ? 'validation-success' : 'validation-error'}">
        ${isValid ? '✓ Transaction Valid' : '✗ Transaction Invalid'}
        ${isValid ? '' : `<br><span style="font-size: 0.75rem">${validationError}</span>`}
        ${!feeSufficient && isValid ? '<br>⚠ Insufficient fee' : ''} 
      </div>
    `;

    // Transaction Info
    txInfo.innerHTML = `
      <div style="background: #262626; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.875rem">
        <div style="margin-bottom: 0.5rem">
          <span style="color: #9ca3af">Fee:</span> <span style="font-weight: 600">${formatNock(nicksToNock(String(fee)))} NOCK</span>
        </div>
        <div style="margin-bottom: 0.5rem">
          <span style="color: #9ca3af">Calculated Fee:</span> <span>${formatNock(nicksToNock(String(calcFee)))} NOCK</span>
        </div>
        <div>
          <span style="color: #9ca3af">TX ID:</span> ${renderCopyableId(state.nockchainTx.id, 'TX ID')}
        </div>
      </div>
    `;

    // Outputs: 0.2 use nockchainTxToRaw + rawTxOutputs (maybe doesn't work)
    const rawTx = wasm.nockchainTxToRaw(state.nockchainTx);
    const outputs = wasm.rawTxOutputs(rawTx);
    if (outputs && outputs.length > 0) {
      outputsList.innerHTML = outputs
        .map((output: wasm.Note, index: number) => {
          const amount = output.assets != null ? BigInt(output.assets) : BigInt(0);
          const firstName = output.name?.first ?? '';
          const lastName = output.name?.last ?? '';
          return `
          <div class="output-item">
            <div style="font-weight: 600; margin-bottom: 0.25rem">
              Output ${index + 1}: ${formatNock(nicksToNock(String(amount)))} NOCK
            </div>
            <div style="font-size: 0.75rem; color: #9ca3af">
              ${firstName ? renderNoteName(firstName, lastName) : 'Unknown'}
            </div>
          </div>
        `;
        })
        .join('');
    } else {
      outputsList.innerHTML = '<div style="font-size: 0.75rem; color: #6b7280">No outputs</div>';
    }

    // Enable download even if invalid, as requested
    downloadTxBtn.disabled = false;

    // Sign button always enabled as requested
    signTxBtn.disabled = false;
  } catch (e) {
    console.error('Error rendering transaction:', e);
    txValidation.innerHTML =
      '<div class="validation-status validation-error">Error rendering transaction</div>';
    txInfo.innerHTML = '';
    outputsList.innerHTML = '';
    downloadTxBtn.disabled = true;
    signTxBtn.disabled = true;
    signedTxSection.classList.add('hidden'); // Ensure signed section is hidden
  }
}

// ===== Event Handlers =====

document.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement;
  const action = target.dataset.action;

  if (!action) return;

  switch (action) {
    case 'refresh':
      refreshNotesForLock(target.dataset.lockId!);
      break;
    case 'remove':
      removeLock(target.dataset.lockId!);
      break;
    case 'select-note':
      addInputToSpend(target.dataset.lockId!, parseInt(target.dataset.noteIndex!));
      break;
    case 'update-fee':
      // Handled by input event
      break;
    case 'add-seed':
      addSeed(target.dataset.inputId!);
      break;
    case 'update-seed-lock':
    case 'update-seed-amount':
      // Handled by change/input events
      break;
    case 'remove-seed':
      removeSeed(target.dataset.inputId!, parseInt(target.dataset.seedIndex!));
      break;
    case 'remove-preimage':
      state.preimages.delete(target.dataset.hash!);
      renderPreimages();
      updateBuilder();
      break;
    case 'remove-prim':
      removePrimitive(target.dataset.primId!);
      break;
    case 'remove-spend':
      removeSpend(target.dataset.inputId!);
      break;
    case 'balance-seed':
      balanceSeed(target.dataset.inputId!, parseInt(target.dataset.seedIndex!));
      break;
  }
});

document.addEventListener('input', (e: Event) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement;
  const action = target.dataset.action;

  if (!action) return;

  // For text inputs, just update state, don't re-render
  switch (action) {
    case 'update-fee':
      updateSpendFee(target.dataset.inputId!, target.value, false); // false = no re-render
      break;
    case 'update-seed-amount':
      updateSeedAmount(
        target.dataset.inputId!,
        parseInt(target.dataset.seedIndex!),
        target.value,
        false
      );
      break;
  }
});

document.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement;
  const action = target.dataset.action;

  // Handle primitive type change
  if (action === 'update-prim-type') {
    const prim = modalPrimitives.find(p => p.id === target.dataset.primId);
    if (prim) {
      prim.type = target.value as 'pkh' | 'tim' | 'hax' | 'brn';
      // Initialize default data for the new type
      if (prim.type === 'pkh') {
        prim.pkh = { m: 1, addrs: [state.walletPkh || ''] };
        delete prim.hax;
        delete prim.tim;
      } else if (prim.type === 'hax') {
        prim.hax = { hashes: [] };
        delete prim.pkh;
        delete prim.tim;
      } else if (prim.type === 'tim') {
        prim.tim = { type: 'csv', value: 1 };
        delete prim.pkh;
        delete prim.hax;
      } else {
        delete prim.pkh;
        delete prim.hax;
        delete prim.tim;
      }
      renderLockModal(); // Re-render to show correct config options
    }
    return;
  }

  if (!action) return;

  // For change events (blur/enter), we can re-render to ensure consistency
  switch (action) {
    case 'update-fee':
      updateSpendFee(target.dataset.inputId!, target.value, true);
      break;
    case 'update-seed-amount':
      updateSeedAmount(
        target.dataset.inputId!,
        parseInt(target.dataset.seedIndex!),
        target.value,
        true
      );
      break;
    case 'update-seed-lock':
      updateSeedLock(target.dataset.inputId!, parseInt(target.dataset.seedIndex!), target.value);
      break;
  }
});

// Lock header click
lockList.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('lock-header')) {
    // Only expand if we didn't click an action button
    if (!(e.target as HTMLElement).closest('.lock-actions')) {
      const lockId = target.dataset.lockId!;
      const lock = state.locks.find(l => l.id === lockId);
      if (lock) {
        lock.expanded = !lock.expanded;
        renderLocks();
        if (lock.expanded && !state.notes.has(lockId)) {
          refreshNotesForLock(lockId);
        }
      }
    }
  }
});

// ==== Lock Modal State ====
interface LockPrimConfig {
  id: string;
  type: 'pkh' | 'tim' | 'hax' | 'brn';
  // Data depends on type
  pkh?: {
    m: number;
    addrs: string[];
  };
  hax?: {
    hashes: string[];
  };
  tim?: {
    type: 'csv' | 'cltv'; // relative (blocks) or absolute (timestamp/height)
    value: number;
  };
}
const modalPrimitives: LockPrimConfig[] = [];

// ...

// ===== Add Lock Modal =====

function renderLockModal() {
  primitivesContainer.innerHTML = modalPrimitives
    .map((prim, index) => {
      let configHtml = '';

      if (prim.type === 'pkh') {
        const pkh = prim.pkh || { m: 1, addrs: [''] };
        configHtml = `
                        <div class="prim-config">
                            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem">
                                <label>Required Signatures (m):</label>
                                <input type="number" class="input" style="width: 60px" min="1" value="${pkh.m}" 
                                    data-action="update-pkh-m" data-prim-id="${prim.id}">
                            </div>
                            <div class="pkh-list">
                                ${pkh.addrs
                                  .map(
                                    (addr, i) => `
                                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem">
                                        <input type="text" class="input" placeholder="PKH Address" value="${addr}" 
                                            data-action="update-pkh-addr" data-prim-id="${prim.id}" data-addr-index="${i}" style="flex: 1">
                                        <button class="btn btn-danger btn-sm" data-action="remove-pkh-addr" data-prim-id="${prim.id}" data-addr-index="${i}">×</button>
                                    </div>
                                `
                                  )
                                  .join('')}
                                <button class="btn btn-sm" data-action="add-pkh-addr" data-prim-id="${prim.id}">+ Add Address</button>
                            </div>
                        </div>
                    `;
      } else if (prim.type === 'hax') {
        const hax = prim.hax || { hashes: [] };
        configHtml = `
                        <div class="prim-config">
                            <div class="hax-list">
                                ${hax.hashes
                                  .map(
                                    (hash, i) => `
                                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem">
                                        <input type="text" class="input" placeholder="Hash (hex)" value="${hash}" 
                                            data-action="update-hax-hash" data-prim-id="${prim.id}" data-hash-index="${i}" style="flex: 1">
                                        <button class="btn btn-danger btn-sm" data-action="remove-hax-hash" data-prim-id="${prim.id}" data-hash-index="${i}">×</button>
                                    </div>
                                `
                                  )
                                  .join('')}
                                <div style="display: flex; gap: 0.5rem">
                                    <button class="btn btn-sm" data-action="add-hax-hash" data-prim-id="${prim.id}">+ Add Hash</button>
                                    <button class="btn btn-sm" data-action="upload-hax-preimage" data-prim-id="${prim.id}">Upload Preimage</button>
                                </div>
                            </div>
                        </div>
                    `;
      } else if (prim.type === 'tim') {
        const tim = prim.tim || { type: 'csv', value: 1 };
        configHtml = `
                        <div class="prim-config">
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem">
                                <select class="input" data-action="update-tim-type" data-prim-id="${prim.id}">
                                    <option value="csv" ${tim.type === 'csv' ? 'selected' : ''}>Relative (Blocks)</option>
                                    <option value="cltv" ${tim.type === 'cltv' ? 'selected' : ''}>Absolute (Height/Time)</option>
                                </select>
                                <input type="number" class="input" value="${tim.value}" 
                                    data-action="update-tim-value" data-prim-id="${prim.id}" style="flex: 1">
                            </div>
                        </div>
                    `;
      }

      return `
                <div class="primitive-item" style="background: #262626; padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 0.75rem">
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center">
                        <select class="input" style="flex: 1" data-prim-id="${prim.id}" data-action="update-prim-type">
                            <option value="pkh" ${prim.type === 'pkh' ? 'selected' : ''}>PKH (Public Key Hash)</option>
                            <option value="tim" ${prim.type === 'tim' ? 'selected' : ''}>TIM (Timelock)</option>
                            <option value="hax" ${prim.type === 'hax' ? 'selected' : ''}>HAX (Hash Preimage)</option>
                            <option value="brn" ${prim.type === 'brn' ? 'selected' : ''}>BRN (Burn)</option>
                        </select>
                        <button class="btn btn-danger btn-sm" data-action="remove-prim" data-prim-id="${prim.id}">×</button>
                    </div>
                    ${configHtml}
                </div>
                `;
    })
    .join('');
}

function openAddLockModal() {
  modalPrimitives.length = 0;
  lockNameInput.value = '';
  renderLockModal();
  addLockModal.className = 'modal active';
}

function closeAddLockModal() {
  addLockModal.className = 'modal';
  modalPrimitives.length = 0;
}

function addPrimitive() {
  modalPrimitives.push({
    id: generateId(),
    type: 'pkh',
    pkh: { m: 1, addrs: [state.walletPkh || ''] },
  });
  renderLockModal();
}

function removePrimitive(primId: string) {
  const index = modalPrimitives.findIndex(p => p.id === primId);
  if (index >= 0) {
    modalPrimitives.splice(index, 1);
    renderLockModal();
  }
}

// Helper to get primitive by ID
function getPrim(id: string) {
  return modalPrimitives.find(p => p.id === id);
}

// Event handlers for inline config
document.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement;
  const action = target.dataset.action;
  if (!action) return;

  const primId = target.dataset.primId;
  if (!primId) return;

  const prim = getPrim(primId);
  if (!prim) return;

  switch (action) {
    case 'add-pkh-addr':
      if (prim.pkh) {
        prim.pkh.addrs.push('');
        renderLockModal();
      }
      break;
    case 'remove-pkh-addr':
      if (prim.pkh) {
        const idx = parseInt(target.dataset.addrIndex!);
        prim.pkh.addrs.splice(idx, 1);
        renderLockModal();
      }
      break;
    case 'add-hax-hash':
      if (prim.hax) {
        prim.hax.hashes.push('');
        renderLockModal();
      }
      break;
    case 'remove-hax-hash':
      if (prim.hax) {
        const idx = parseInt(target.dataset.hashIndex!);
        prim.hax.hashes.splice(idx, 1);
        renderLockModal();
      }
      break;
    case 'upload-hax-preimage':
      // Create a hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = async (ev: Event) => {
        const target = ev.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file && prim.hax) {
          const buf = await file.arrayBuffer();
          const bytes = new Uint8Array(buf);
          const hash = wasm.hashNoun(bytes);
          const hashStr = hash;
          prim.hax.hashes.push(hashStr);

          // Also add to global preimages
          state.preimages.set(hashStr, bytes);
          renderPreimages();

          renderLockModal();
        }
      };
      input.click();
      break;
  }
});

document.addEventListener('input', (e: Event) => {
  const target = e.target as HTMLInputElement;
  const action = target.dataset.action;
  if (!action) return;

  const primId = target.dataset.primId;
  if (!primId) return;

  const prim = getPrim(primId);
  if (!prim) return;

  switch (action) {
    case 'update-pkh-m':
      if (prim.pkh) prim.pkh.m = parseInt(target.value) || 1;
      break;
    case 'update-pkh-addr':
      if (prim.pkh) prim.pkh.addrs[parseInt(target.dataset.addrIndex!)] = target.value;
      break;
    case 'update-hax-hash':
      if (prim.hax) prim.hax.hashes[parseInt(target.dataset.hashIndex!)] = target.value;
      break;
    case 'update-tim-value':
      if (prim.tim) prim.tim.value = parseInt(target.value) || 0;
      break;
  }
});

document.addEventListener('change', (e: Event) => {
  const target = e.target as HTMLSelectElement;
  const action = target.dataset.action;

  if (action === 'update-tim-type') {
    const prim = getPrim(target.dataset.primId!);
    if (prim && prim.tim) {
      prim.tim.type = target.value as 'csv' | 'cltv';
    }
  }
});

function confirmAddLock() {
  const name = lockNameInput.value.trim();
  if (!name) {
    alert('Please enter a lock name');
    return;
  }

  if (modalPrimitives.length === 0) {
    alert('Please add at least one lock primitive');
    return;
  }

  try {
    const primitives: wasm.SpendCondition = [];

    for (const prim of modalPrimitives) {
      switch (prim.type) {
        case 'pkh': {
          const pkhConfig = prim.pkh || { m: 1, addrs: [] };
          const validAddrs = pkhConfig.addrs.filter(a => a.trim() !== '');
          if (validAddrs.length === 0) {
            alert('PKH requires at least one address');
            return;
          }
          primitives.push({ Pkh: { m: pkhConfig.m, hashes: validAddrs } });
          break;
        }
        case 'tim': {
          const timConfig = prim.tim || { type: 'csv', value: 1 };
          const value = timConfig.value ?? 0;
          if (timConfig.type === 'csv') {
            primitives.push({
              Tim: {
                rel: { min: value, max: undefined },
                abs: { min: undefined, max: undefined },
              },
            });
          } else {
            primitives.push({
              Tim: {
                rel: { min: undefined, max: undefined },
                abs: { min: value, max: undefined },
              },
            });
          }
          break;
        }
        case 'hax': {
          const haxConfig = prim.hax || { hashes: [] };
          const validHashes = haxConfig.hashes.filter(h => h.trim() !== '');
          if (validHashes.length === 0) {
            alert('HAX requires at least one hash.');
            return;
          }
          primitives.push({ Hax: validHashes });
          break;
        }
        case 'brn':
          primitives.push('Brn');
          break;
      }
    }

    const newLock: Lock = {
      id: generateId(),
      name,
      spendCondition: primitives,
      expanded: false,
    };

    state.locks.push(newLock);
    renderLocks();
    closeAddLockModal();
  } catch (e) {
    console.error('Failed to create lock:', e);
    alert('Failed to create lock: ' + (e as Error).message);
  }
}

// ===== Import/Export Locks =====

function exportLocks() {
  try {
    const locksData = state.locks.map(lock => ({
      id: lock.id,
      name: lock.name,
      spendCondition: lock.spendCondition, // 0.2: plain array
    }));

    const json = JSON.stringify(locksData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locks.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Exported locks');
  } catch (e) {
    console.error('Failed to export locks:', e);
    alert('Failed to export locks');
  }
}

function importLocks() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const locksData = JSON.parse(text);

      if (!Array.isArray(locksData)) {
        alert('Invalid locks file');
        return;
      }

      let importedCount = 0;
      for (const lockData of locksData) {
        const sc = lockData.spendCondition;
        if (!Array.isArray(sc) || sc.length === 0) {
          console.log('Skipping invalid lock (expected spendCondition array):', lockData.name);
          continue;
        }
        const hash = wasm.spendConditionHash(sc as wasm.SpendCondition);
        const exists = state.locks.some(l => wasm.spendConditionHash(l.spendCondition) === hash);
        if (exists) {
          console.log(`Skipping duplicate lock: ${lockData.name} (${hash})`);
          continue;
        }
        state.locks.push({
          id: lockData.id || generateId(),
          name: lockData.name || 'Imported Lock',
          spendCondition: sc as wasm.SpendCondition,
          expanded: false,
        });
        importedCount++;
      }

      renderLocks();
      console.log(`Imported ${importedCount} locks`);
      if (importedCount < locksData.length) {
        console.log(
          `Imported ${importedCount} locks. Skipped ${locksData.length - importedCount} duplicates.`
        );
      }
    } catch (e) {
      console.error('Failed to import locks:', e);
      alert('Failed to import locks: ' + (e as Error).message);
    }
  };
  input.click();
}

// Buttons
addLockBtn.onclick = () => openAddLockModal();
closeLockModal.onclick = cancelAddLockBtn.onclick = () => closeAddLockModal();
addPrimitiveBtn.onclick = () => addPrimitive();
confirmAddLockBtn.onclick = () => confirmAddLock();
importLocksBtn.onclick = () => importLocks();
exportLocksBtn.onclick = () => exportLocks();

refreshAllBtn.onclick = () => refreshAllNotes();
addPreimageBtn.onclick = () => (addPreimageModal.className = 'modal active');
closePreimageModal.onclick = cancelPreimageBtn.onclick = () =>
  (addPreimageModal.className = 'modal');
addPreimageConfirmBtn.onclick = () => addPreimageFromFile();

downloadTxBtn.onclick = () => {
  if (!state.nockchainTx) return;

  try {
    const rawTx = wasm.nockchainTxToRaw(state.nockchainTx);
    const jamBytes = wasm.jam(rawTx as unknown as wasm.Noun);
    const txId = state.nockchainTx.id;

    const blob = new Blob([new Uint8Array(jamBytes)], { type: 'application/jam' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${txId}.tx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Downloaded unsigned transaction:', txId);
  } catch (e) {
    console.error('Failed to download transaction:', e);
    alert('Failed to download transaction');
  }
};

signTxBtn.onclick = async () => {
  if (!state.nockchainTx || !state.builder || !state.provider) return;

  try {
    const txNotes = state.builder.allNotes();
    const rawTx = wasm.nockchainTxToRaw(state.nockchainTx) as wasm.RawTxV1;
    const rawTxProto = wasm.rawTxToProtobuf(rawTx);
    const notesProto = txNotes.notes.map((n: wasm.Note) => wasm.note_to_protobuf(n));

    const signedTxProtobuf = await state.provider.signRawTx({
      rawTx: rawTxProto,
      notes: notesProto,
      spendConditions: txNotes.spend_conditions,
    });

    const signedTxProtoObj =
      typeof signedTxProtobuf === 'object' && !(signedTxProtobuf instanceof Uint8Array)
        ? signedTxProtobuf
        : (signedTxProtobuf as unknown as wasm.PbCom2RawTransaction);
    const signedRawTx = wasm.rawTxFromProtobuf(signedTxProtoObj) as wasm.RawTxV1;
    state.signedTx = wasm.rawTxToNockchainTx(signedRawTx);

    let isValid = true;
    let validationError = '';

    try {
      const txSettings: wasm.TxEngineSettings = {
        tx_engine_version: 1,
        tx_engine_patch: 0,
        min_fee: '256',
        cost_per_word: '32768',
        witness_word_div: 1,
      };
      const signedBuilder = wasm.TxBuilder.fromTx(
        signedRawTx,
        txNotes.notes,
        txNotes.spend_conditions,
        txSettings
      );
      signedBuilder.validate();
      signedBuilder.free();
      console.log('Signed transaction validated successfully');
    } catch (e) {
      console.error('Signed transaction validation failed:', e);
      isValid = false;
      validationError = e instanceof Error ? e.message : String(e);
    }
    if (state.signedTx) {
      state.signedTxId = state.signedTx.id;
      signedTxSection.classList.remove('hidden');
      signedTxIdEl.innerHTML = renderCopyableId(
        state.signedTxId ?? state.signedTx.id,
        'Signed TX ID'
      );

      // Render Validation Status
      const signedTxValidation = document.getElementById('signedTxValidation');
      if (signedTxValidation) {
        signedTxValidation.innerHTML = `
                    <div class="validation-status ${isValid ? 'validation-success' : 'validation-error'}">
                        ${isValid ? '✓ Transaction Valid' : '✗ Transaction Invalid'}
                        ${isValid ? '' : `<br><span style="font-size: 0.75rem">${validationError}</span>`}
                    </div>
                `;
      }

      const submitBtn = document.getElementById('submitSignedTxBtn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = !isValid;
        submitBtn.title = isValid ? '' : 'Transaction is invalid';
      }

      console.log('Transaction signed:', state.signedTxId);
    }
  } catch (e) {
    console.error('Failed to sign transaction:', e);
    alert('Failed to sign transaction: ' + (e instanceof Error ? e.message : String(e)));
  }
};

// Post-Sign Handlers
document.getElementById('downloadSignedTxBtn')!.onclick = () => {
  if (!state.signedTx || !state.signedTxId) return;

  try {
    const rawTx = wasm.nockchainTxToRaw(state.signedTx);
    const jamBytes = wasm.jam(rawTx as unknown as wasm.Noun);
    const blob = new Blob([new Uint8Array(jamBytes)], { type: 'application/jam' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.signedTxId}-signed.tx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const rawTxForJam = wasm.nockchainTxToRaw(state.signedTx);
    const rawTxBytes = wasm.jam(rawTxForJam as unknown as wasm.Noun);
    const blobRaw = new Blob([new Uint8Array(rawTxBytes)], { type: 'application/jam' });
    const urlRaw = URL.createObjectURL(blobRaw);
    const aRaw = document.createElement('a');
    aRaw.href = urlRaw;
    aRaw.download = `${state.signedTxId}-signed.raw.jam`;
    document.body.appendChild(aRaw);
    aRaw.click();
    document.body.removeChild(aRaw);
    URL.revokeObjectURL(urlRaw);
  } catch (e) {
    console.error('Failed to download signed tx:', e);
    alert('Failed to download signed tx');
  }
};

document.getElementById('submitSignedTxBtn')!.onclick = async () => {
  if (!state.signedTx) return;

  try {
    if (!state.grpcClient) throw new Error('gRPC client not initialized');

    const rawTx = wasm.nockchainTxToRaw(state.signedTx) as wasm.RawTxV1;
    const txProtobuf = wasm.rawTxToProtobuf(rawTx);
    await state.grpcClient.sendTransaction(txProtobuf);

    console.log('Transaction submitted successfully!');
  } catch (e) {
    console.error('Failed to submit transaction:', e);
    alert('Failed to submit transaction: ' + (e as Error).message);
  }
};

// Initialize
init();
