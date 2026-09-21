const numberInput = document.querySelector('#number-input');
const decrementButton = document.querySelector('#decrement-button');
const incrementButton = document.querySelector('#increment-button');
const resultCard = document.querySelector('#result-card');
const resultText = document.querySelector('#result-text');
const resultDetail = document.querySelector('#result-detail');
const saveList = document.querySelector('#save-list');
const brandMark = document.querySelector('.brand-mark');
const addSaveButton = document.querySelector('#add-save-button');
const saveDialog = document.querySelector('#save-dialog');
const saveForm = document.querySelector('#save-form');
const closeDialogButton = document.querySelector('#close-dialog-button');
const cancelDialogButton = document.querySelector('#cancel-dialog-button');
const saveNameInput = document.querySelector('#save-name');
const saveNumberInput = document.querySelector('#save-number');
const exportSavesButton = document.querySelector('#export-saves-button');
const importSavesButton = document.querySelector('#import-saves-button');
const transferDialog = document.querySelector('#transfer-dialog');
const importForm = document.querySelector('#import-form');
const importText = document.querySelector('#import-text');
const importError = document.querySelector('#import-error');
const closeImportButton = document.querySelector('#close-import-button');
const cancelImportButton = document.querySelector('#cancel-import-button');

const storageKey = 'z7boom-saves';
const exportHeader = 'Z7BOOM SAVES v1';
let saves = readSaves();

function readSaves() {
  try {
    const storedSaves = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(storedSaves) ? storedSaves : [];
  } catch {
    return [];
  }
}

function currentNumber() {
  const value = Number(numberInput.value);
  return Number.isInteger(value) ? value : null;
}

function isBoom(number) {
  return String(Math.abs(number)).includes('7') || number % 7 === 0;
}

function saveSaves() {
  localStorage.setItem(storageKey, JSON.stringify(saves));
}

function exportMessage() {
  return `${exportHeader}\n${JSON.stringify(saves)}`;
}

async function exportSaves() {
  const message = exportMessage();
  try {
    await navigator.clipboard.writeText(message);
    exportSavesButton.textContent = 'Copied';
  } catch {
    const temporaryInput = document.createElement('textarea');
    temporaryInput.value = message;
    document.body.append(temporaryInput);
    temporaryInput.select();
    document.execCommand('copy');
    temporaryInput.remove();
    exportSavesButton.textContent = 'Copied';
  }
  setTimeout(() => { exportSavesButton.textContent = 'Export'; }, 1600);
}

function parseImportedSaves(message) {
  const lines = message.trim().split(/\n/);
  if (lines.shift()?.trim() !== exportHeader) throw new Error('Invalid export');
  const imported = JSON.parse(lines.join('\n'));
  if (!Array.isArray(imported)) throw new Error('Invalid export');

  const validSaves = imported.filter((save) => (
    save && typeof save.name === 'string' && save.name.trim() && Number.isInteger(save.number)
  )).map((save) => ({ name: save.name.trim().slice(0, 40), number: save.number }));

  if (validSaves.length !== imported.length) throw new Error('Invalid save list');
  return validSaves;
}

function openImportDialog() {
  importForm.reset();
  importError.textContent = '';
  transferDialog.showModal();
  importText.focus();
}

function closeImportDialog() {
  transferDialog.close();
}

function renderSaves() {
  saveList.replaceChildren();

  if (saves.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No custom calls yet. Add one for the numbers that deserve a personal response.';
    saveList.append(emptyState);
    return;
  }

  saves.forEach((save, index) => {
    const item = document.createElement('div');
    item.className = 'save-item';

    const meta = document.createElement('div');
    meta.className = 'save-meta';
    const name = document.createElement('span');
    name.className = 'save-name';
    name.textContent = save.name;
    const number = document.createElement('span');
    number.className = 'save-number';
    number.textContent = save.number;
    meta.append(name, number);

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-save';
    deleteButton.type = 'button';
    deleteButton.setAttribute('aria-label', `Delete ${save.name}`);
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', () => {
      saves.splice(index, 1);
      saveSaves();
      renderSaves();
      updateResult();
    });

    item.append(meta, deleteButton);
    saveList.append(item);
  });
}

function updateResult() {
  const number = currentNumber();
  if (number === null) {
    resultText.textContent = '—';
    resultDetail.textContent = 'Whole numbers only';
    resultCard.className = 'result-card is-true';
    return;
  }

  const customSave = saves.find((save) => save.number === number);
  if (customSave) {
    resultText.textContent = customSave.name;
    resultDetail.textContent = `Saved for ${number}`;
    resultCard.className = 'result-card is-custom';
    return;
  }

  if (isBoom(number)) {
    const containsSeven = String(Math.abs(number)).includes('7');
    resultText.textContent = 'Boom';
    resultDetail.textContent = containsSeven ? 'Contains 7' : 'Divisible by 7';
    resultCard.className = 'result-card is-boom';
    return;
  }

  resultText.textContent = 'True';
  resultDetail.textContent = 'No boom rule matched';
  resultCard.className = 'result-card is-true';
}

function nudgeNumber(amount) {
  const currentValue = currentNumber() ?? 1;
  const nextValue = currentValue + amount;
  numberInput.value = Math.max(1, nextValue);
  updateResult();
}

function openSaveDialog() {
  saveForm.reset();
  saveNumberInput.value = currentNumber() ?? '';
  saveDialog.showModal();
  saveNameInput.focus();
}

function resetToOne() {
  numberInput.value = '1';
  updateResult();
}

function closeSaveDialog() {
  saveDialog.close();
}

decrementButton.addEventListener('click', () => nudgeNumber(-1));
incrementButton.addEventListener('click', () => nudgeNumber(1));
brandMark.addEventListener('click', resetToOne);
numberInput.addEventListener('input', updateResult);
addSaveButton.addEventListener('click', openSaveDialog);
exportSavesButton.addEventListener('click', exportSaves);
importSavesButton.addEventListener('click', openImportDialog);
closeDialogButton.addEventListener('click', closeSaveDialog);
cancelDialogButton.addEventListener('click', closeSaveDialog);
saveDialog.addEventListener('click', (event) => {
  if (event.target === saveDialog) closeSaveDialog();
});
closeImportButton.addEventListener('click', closeImportDialog);
cancelImportButton.addEventListener('click', closeImportDialog);
transferDialog.addEventListener('click', (event) => {
  if (event.target === transferDialog) closeImportDialog();
});
importForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const importedSaves = parseImportedSaves(importText.value);
    const savesByNumber = new Map(saves.map((save) => [save.number, save]));
    importedSaves.forEach((save) => savesByNumber.set(save.number, save));
    saves = Array.from(savesByNumber.values());
    saveSaves();
    renderSaves();
    updateResult();
    closeImportDialog();
  } catch {
    importError.textContent = 'Invalid Z7boom export';
  }
});
saveForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = saveNameInput.value.trim();
  const number = Number(saveNumberInput.value);
  if (!name || !Number.isInteger(number)) return;

  saves = saves.filter((save) => save.number !== number);
  saves.unshift({ name, number });
  saveSaves();
  renderSaves();
  numberInput.value = number;
  updateResult();
  closeSaveDialog();
});

renderSaves();
updateResult();
