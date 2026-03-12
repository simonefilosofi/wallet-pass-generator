/* ── State ── */
const state = {
  barcodeData: '',
};

/* ── DOM refs ── */
const dropZone       = document.getElementById('dropZone');
const qrFileInput    = document.getElementById('qrFileInput');
const dropIdle       = document.getElementById('dropIdle');
const dropPreview    = document.getElementById('dropPreview');
const qrPreviewImg   = document.getElementById('qrPreviewImg');
const dropClear      = document.getElementById('dropClear');
const decodeResult   = document.getElementById('decodeResult');
const decodeError    = document.getElementById('decodeError');
const decodeStatus   = document.getElementById('decodeStatus');
const decodeStatusText = document.getElementById('decodeStatusText');
const barcodeDataInput = document.getElementById('barcodeData');
const downloadBtn    = document.getElementById('downloadBtn');
const downloadNote   = document.getElementById('downloadNote');

/* ── Hidden canvas for QR decoding ── */
const canvas = document.createElement('canvas');
canvas.hidden = true;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

/* ── Helpers ── */
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function setDecodeSuccess(data) {
  state.barcodeData = data;
  barcodeDataInput.value = data;
  decodeStatusText.textContent = 'QR code detected';
  decodeStatus.classList.remove('error');
  show(decodeResult);
  hide(decodeError);
  downloadBtn.disabled = false;
  downloadNote.textContent = '';
}

function setDecodeError() {
  state.barcodeData = '';
  barcodeDataInput.value = '';
  hide(decodeResult);
  show(decodeError);
  downloadBtn.disabled = true;
  downloadNote.textContent = 'Upload a QR code image to enable download.';
}

/* ── QR decode ── */
function decodeQR(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const blob = new Blob([e.target.result]);
    const url  = URL.createObjectURL(blob);
    const img  = new Image();

    img.onload = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result    = jsQR(imageData.data, canvas.width, canvas.height);

      if (result && result.data) {
        setDecodeSuccess(result.data);
      } else {
        setDecodeError();
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setDecodeError();
    };

    img.src = url;
  };

  reader.readAsArrayBuffer(file);
}

/* ── Show image preview ── */
function loadPreview(file) {
  const url = URL.createObjectURL(file);
  qrPreviewImg.onload = () => URL.revokeObjectURL(url);
  qrPreviewImg.src    = url;
  hide(dropIdle);
  show(dropPreview);
}

/* ── Handle file ── */
function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  hide(decodeResult);
  hide(decodeError);
  loadPreview(file);
  decodeQR(file);
}

/* ── Clear ── */
function clearUpload() {
  qrFileInput.value  = '';
  qrPreviewImg.src   = '';
  state.barcodeData  = '';
  barcodeDataInput.value = '';
  hide(dropPreview);
  show(dropIdle);
  hide(decodeResult);
  hide(decodeError);
  downloadBtn.disabled = true;
  downloadNote.textContent = 'Upload a QR code image to enable download.';
}

/* ── Drop zone events ── */
dropZone.addEventListener('click', (e) => {
  if (!e.target.closest('#dropClear')) qrFileInput.click();
});

dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    qrFileInput.click();
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

qrFileInput.addEventListener('change', () => {
  if (qrFileInput.files[0]) handleFile(qrFileInput.files[0]);
});

dropClear.addEventListener('click', (e) => {
  e.stopPropagation();
  clearUpload();
});

/* ── Keep state.barcodeData in sync if user edits the input ── */
barcodeDataInput.addEventListener('input', () => {
  state.barcodeData = barcodeDataInput.value;
  downloadBtn.disabled = !state.barcodeData.trim();
});
