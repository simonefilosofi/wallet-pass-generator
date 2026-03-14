/* ── Signing proxy URL ─────────────────────────────────────
   After deploying worker.js to Cloudflare, paste the URL here.
   e.g. 'https://luiss-pass-signer.yourname.workers.dev'
   Leave empty to disable the signed-download button.
   ─────────────────────────────────────────────────────────── */
const WORKER_URL = 'https://luiss-pass-signer.simonefilosofi.workers.dev';

/* ── State ── */
const state = {
  barcodeData: '',
  qrDataUrl:   '',
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

const NOTE_UPLOAD_QR = 'Upload a QR code image to enable download.';
const NOTE_FILL_FIELDS = 'Enter your full name and matricola to enable download.';
const NOTE_INVALID_ID = 'Matricola must be exactly 6 digits.';
const NOTE_INVALID_NAME = 'Full name must contain letters only.';

/* ── Hidden canvas for QR decoding ── */
const canvas = document.createElement('canvas');
canvas.hidden = true;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

/* ── Helpers ── */
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function hasValidFullName() {
  return /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(field1ValueInput.value.trim());
}

function hasValidIdNumber() {
  return /^[0-9]{6}$/.test(field2ValueInput.value.trim());
}

function hasRequiredIdentityFields() {
  return !!(field1ValueInput.value.trim() && hasValidFullName() && hasValidIdNumber());
}

function canGeneratePass() {
  return !!(state.barcodeData.trim() && hasRequiredIdentityFields());
}

function updateDownloadBtnState() {
  downloadBtn.disabled = !canGeneratePass();

  if (!state.barcodeData.trim()) {
    downloadNote.textContent = NOTE_UPLOAD_QR;
    return;
  }

  if (!hasRequiredIdentityFields()) {
    if (field1ValueInput.value.trim() && !hasValidFullName()) {
      downloadNote.textContent = NOTE_INVALID_NAME;
      return;
    }

    downloadNote.textContent = field2ValueInput.value.trim() && !hasValidIdNumber()
      ? NOTE_INVALID_ID
      : NOTE_FILL_FIELDS;
    return;
  }

  if (
    downloadNote.textContent === NOTE_UPLOAD_QR
    || downloadNote.textContent === NOTE_FILL_FIELDS
    || downloadNote.textContent === NOTE_INVALID_ID
    || downloadNote.textContent === NOTE_INVALID_NAME
  ) {
    downloadNote.textContent = '';
  }
}

function setDecodeSuccess(data) {
  state.barcodeData = data;
  barcodeDataInput.value = data;
  decodeStatusText.textContent = 'QR code detected';
  decodeStatus.classList.remove('error');
  show(decodeResult);
  hide(decodeError);
  updateDownloadBtnState();
  renderPreview();
  updateSignedBtnState();
}

function setDecodeError() {
  state.barcodeData = '';
  barcodeDataInput.value = '';
  hide(decodeResult);
  show(decodeError);
  updateDownloadBtnState();
  renderPreview();
  updateSignedBtnState();
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
  // Store data URL so web pass export can embed the QR image inline
  const r = new FileReader();
  r.onload = e => { state.qrDataUrl = e.target.result; };
  r.readAsDataURL(file);
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
  state.qrDataUrl  = '';
  updateDownloadBtnState();
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
  updateDownloadBtnState();
  updateSignedBtnState();
  renderPreview();
});


/* ══════════════════════════════════════════════════════════
   LIVE PREVIEW
   ══════════════════════════════════════════════════════════ */

/* ── Extended state ── */
state.logoDataUrl = null;
state.logoFile    = null;

/* ── Preview DOM refs ── */
const passCard          = document.getElementById('passCard');
const passOrg           = document.getElementById('passOrg');
const passLogoLetter    = document.getElementById('passLogoLetter');
const passLogoImg       = document.getElementById('passLogoImg');

const passNameRow       = document.getElementById('passNameRow');
const passNamePreview   = document.getElementById('passNamePreview');
const passField2        = document.getElementById('passField2');
const passField1LabelEl = document.getElementById('passField1Label');
const passField1ValueEl = document.getElementById('passField1Value');
const passField2LabelEl = document.getElementById('passField2Label');
const passField2ValueEl = document.getElementById('passField2Value');
const barcodeAltPreview = document.getElementById('barcodeAltPreview');
const passQrCanvas      = document.getElementById('passQrCanvas');
const passQrCtx         = passQrCanvas.getContext('2d');

/* ── Form input refs ── */
const orgNameInput       = document.getElementById('orgName');
const passTitleInput     = document.getElementById('passTitle');
const firstNameInput     = document.getElementById('firstName');
const lastNameInput      = document.getElementById('lastName');
const field1LabelInput   = document.getElementById('field1Label');
const field1ValueInput   = document.getElementById('field1Value');
const field2LabelInput   = document.getElementById('field2Label');
const field2ValueInput   = document.getElementById('field2Value');
const bgColorInput       = document.getElementById('bgColor');
const bgColorHexInput    = document.getElementById('bgColorHex');
const fgColorInput       = document.getElementById('fgColor');
const fgColorHexInput    = document.getElementById('fgColorHex');
const labelColorInput    = document.getElementById('labelColor');
const labelColorHexInput = document.getElementById('labelColorHex');
const logoFileInput      = document.getElementById('logoFileInput');
const logoFileName       = document.getElementById('logoFileName');

const signingToggle      = document.getElementById('signingToggle');
const signingBody        = document.getElementById('signingBody');
const p12File            = document.getElementById('p12File');
const p12FileNameEl      = document.getElementById('p12FileName');
const p12PasswordGroup   = document.getElementById('p12PasswordGroup');

/* ── QR placeholder canvas ── */
function drawQrPlaceholder() {
  const c = passQrCtx;
  const S = passQrCanvas.width; // 64

  c.clearRect(0, 0, S, S);

  // White background
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(0, 0, S, S, 4);
  c.fill();

  const dark = '#1a1a2e';

  // Finder pattern: outer square → white inner → dark centre
  function finder(x, y) {
    c.fillStyle = dark;
    c.fillRect(x, y, 20, 20);
    c.fillStyle = '#ffffff';
    c.fillRect(x + 3, y + 3, 14, 14);
    c.fillStyle = dark;
    c.fillRect(x + 6, y + 6, 8, 8);
  }

  finder(6, 6);   // top-left
  finder(38, 6);  // top-right
  finder(6, 38);  // bottom-left

  // Decorative data modules
  c.fillStyle = dark;
  [
    [30, 6], [30, 12], [36, 12],
    [30, 30], [36, 30], [42, 30],
    [30, 36], [42, 36],
    [30, 42], [36, 42], [42, 42],
    [48, 30], [48, 36], [48, 42],
    [38, 48], [44, 48],
  ].forEach(([dx, dy]) => c.fillRect(dx, dy, 5, 5));
}

/* ── Render all preview elements ── */
function renderPreview() {
  // Colors via CSS custom properties on the card root
  passCard.style.setProperty('--pass-bg',    bgColorInput.value);
  passCard.style.setProperty('--pass-fg',    fgColorInput.value);
  passCard.style.setProperty('--pass-label', labelColorInput.value);

  // Org name + letter avatar
  const org = orgNameInput.value.trim() || 'My Organization';
  passOrg.textContent        = org;
  passLogoLetter.textContent = org.charAt(0).toUpperCase();

  // Logo image vs letter placeholder
  if (state.logoDataUrl) {
    passLogoImg.src = state.logoDataUrl;
    passLogoImg.classList.remove('hidden');
    passLogoLetter.classList.add('hidden');
  } else {
    passLogoImg.classList.add('hidden');
    passLogoLetter.classList.remove('hidden');
  }

  // Name / Surname
  const firstName = firstNameInput.value.trim();
  const lastName  = lastNameInput.value.trim();
  const fullName  = [firstName, lastName].filter(Boolean).join(' ');
  if (fullName) {
    passNamePreview.textContent = fullName;
    passNameRow.classList.remove('hidden');
  } else {
    passNameRow.classList.add('hidden');
  }

  // Match signed pass template: one unified label/value line.
  const combinedLabel = [
    field1LabelInput.value.trim() || 'Student',
    field2LabelInput.value.trim() || 'Matricola',
  ].join(' - ');
  const combinedValue = [
    field1ValueInput.value.trim(),
    field2ValueInput.value.trim(),
  ].filter(Boolean).join(' - ');

  passField1LabelEl.textContent = combinedLabel.toUpperCase();
  passField1ValueEl.textContent = combinedValue || '—';
  passField2.classList.add('hidden');

  // Barcode alt text — show decoded data (truncated) or fallback
  const alt = state.barcodeData;
  barcodeAltPreview.textContent = alt
    ? (alt.length > 28 ? alt.slice(0, 26) + '\u2026' : alt)
    : 'Scan to open';

  // Redraw QR placeholder canvas
  drawQrPlaceholder();
}


/* ── Text input → re-render ── */
[orgNameInput, passTitleInput,
 firstNameInput, lastNameInput,
 field1LabelInput, field1ValueInput,
 field2LabelInput, field2ValueInput].forEach(el => el.addEventListener('input', renderPreview));

[field1ValueInput, field2ValueInput].forEach(el => el.addEventListener('input', () => {
  if (el === field1ValueInput) {
    // Keep full name as letters and spaces only.
    field1ValueInput.value = field1ValueInput.value
      .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '')
      .replace(/\s+/g, ' ')
      .trimStart();
  }

  if (el === field2ValueInput) {
    // Keep ID as digits only and cap at 6 chars.
    field2ValueInput.value = field2ValueInput.value.replace(/\D/g, '').slice(0, 6);
  }

  updateDownloadBtnState();
  updateSignedBtnState();
}));

/* ── Logo upload ── */
logoFileInput.addEventListener('change', () => {
  const file = logoFileInput.files[0];
  if (!file || !file.type.startsWith('image/')) return;
  logoFileName.textContent = file.name;
  const reader = new FileReader();
  state.logoFile = file;
  reader.onload = (e) => { state.logoDataUrl = e.target.result; renderPreview(); };
  reader.readAsDataURL(file);
});

/* ── Signing section collapsible toggle ── */
signingToggle.addEventListener('click', () => {
  const expanded = signingToggle.getAttribute('aria-expanded') === 'true';
  signingToggle.setAttribute('aria-expanded', String(!expanded));
  signingBody.classList.toggle('hidden');
});

/* ── p12 file name + password field visibility ── */
p12File.addEventListener('change', () => {
  p12FileNameEl.textContent      = p12File.files[0]?.name ?? 'No file chosen';
  p12PasswordGroup.style.display = p12File.files[0] ? '' : 'none';
});

/* ── Initial render ── */
renderPreview();
updateDownloadBtnState();
loadDefaultLogo();


/* ══════════════════════════════════════════════════════════
   ICON GENERATION
   ══════════════════════════════════════════════════════════ */

/**
 * Draw a rounded-square letter icon at `size`×`size` px.
 * Uses the current bg/fg colors and first letter of org name.
 * Returns a Promise<Blob> (image/png).
 */
function drawLetterIcon(size) {
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = size;
  const cx = cvs.getContext('2d');

  // Rounded square background
  const radius = Math.round(size * 0.22);
  cx.fillStyle = bgColorInput.value;
  cx.beginPath();
  cx.roundRect(0, 0, size, size, radius);
  cx.fill();

  // Centered first letter
  const letter = (orgNameInput.value.trim() || 'My Organization').charAt(0).toUpperCase();
  cx.fillStyle    = fgColorInput.value;
  cx.font         = `700 ${Math.round(size * 0.54)}px -apple-system, BlinkMacSystemFont, sans-serif`;
  cx.textAlign    = 'center';
  cx.textBaseline = 'middle';
  cx.fillText(letter, size / 2, size / 2);

  return new Promise(resolve => cvs.toBlob(resolve, 'image/png'));
}

/**
 * Scale any image Blob to `size`×`size` px via canvas.
 * Returns a Promise<Blob> (image/png).
 */
function scaleImageBlob(blob, size) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const cvs = document.createElement('canvas');
      cvs.width = cvs.height = size;
      cvs.getContext('2d').drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      cvs.toBlob(resolve, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Icon image load failed')); };
    img.src = url;
  });
}

/**
 * Produce { icon: Blob, icon2x: Blob } for pass bundling.
 *
 * No logo  → generate both sizes from canvas (letter on bg color).
 *            icon.png  = 29×29, icon@2x.png = 58×58
 *
 * Logo     → treat the original file as icon@2x.png (high-res source);
 *            scale down to 29×29 for icon.png.
 */
async function generateIconBlobs() {
  if (state.logoFile) {
    const raw     = await state.logoFile.arrayBuffer();
    const icon2x  = new Blob([raw], { type: state.logoFile.type });
    const icon    = await scaleImageBlob(icon2x, 29);
    return { icon, icon2x };
  }

  const [icon, icon2x] = await Promise.all([
    drawLetterIcon(29),
    drawLetterIcon(58),
  ]);
  return { icon, icon2x };
}


/* ══════════════════════════════════════════════════════════
   PASS.JSON GENERATION
   ══════════════════════════════════════════════════════════ */

/** Convert a 6-digit hex color string to "rgb(r,g,b)" */
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgb(${(n >> 16) & 0xff},${(n >> 8) & 0xff},${n & 0xff})`;
}

/**
 * Build and return the pass.json object from current state.
 * passType is always "generic" — covers the widest set of use-cases
 * without requiring a specific pass category.
 */
function buildPassJson() {
  const org   = orgNameInput.value.trim()   || 'My Organization';
  const title = passTitleInput.value.trim() || 'My Pass';

  const secondaryFields = [];

  // Name field (shown first if present)
  const pFirstName = firstNameInput.value.trim();
  const pLastName  = lastNameInput.value.trim();
  const pFullName  = [pFirstName, pLastName].filter(Boolean).join(' ');
  if (pFullName) {
    secondaryFields.push({ key: 'name', label: 'Name', value: pFullName });
  }

  const label1 = field1LabelInput.value.trim();
  const value1 = field1ValueInput.value.trim();
  if (label1 || value1) {
    secondaryFields.push({ key: 'field1', label: label1, value: value1 });
  }

  const label2 = field2LabelInput.value.trim();
  const value2 = field2ValueInput.value.trim();
  if (label2 || value2) {
    secondaryFields.push({ key: 'field2', label: label2, value: value2 });
  }

  return {
    formatVersion: 1,
    passTypeIdentifier: 'pass.com.walletpass.generator',
    teamIdentifier:     'TEAMID0000',
    serialNumber:       crypto.randomUUID(),
    organizationName:   org,
    description:        title,
    backgroundColor:    hexToRgb(bgColorInput.value),
    foregroundColor:    hexToRgb(fgColorInput.value),
    labelColor:         hexToRgb(labelColorInput.value),
    generic: {
      secondaryFields,
    },
    barcodes: [
      {
        message:         state.barcodeData,
        format:          'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
      },
    ],
  };
}


/* ══════════════════════════════════════════════════════════
   MANIFEST.JSON GENERATION
   ══════════════════════════════════════════════════════════ */

/** SHA-1 hash a Blob or ArrayBuffer → lowercase hex string */
async function sha1Hex(source) {
  const buffer = (source instanceof ArrayBuffer || ArrayBuffer.isView(source))
    ? source
    : await source.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-1', buffer);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Build the manifest object and return it alongside the file map
 * so the same blobs can be reused when assembling the ZIP.
 *
 * files: { [filename]: Blob | ArrayBuffer }
 * returns: { manifest: object, manifestJson: string }
 */
async function buildManifest(files) {
  const manifest = {};
  for (const [name, data] of Object.entries(files)) {
    manifest[name] = await sha1Hex(data);
  }
  return { manifest, manifestJson: JSON.stringify(manifest) };
}


/* ══════════════════════════════════════════════════════════
   SIGNATURE GENERATION
   ══════════════════════════════════════════════════════════ */

/**
 * Minimal valid PKCS#7 DER — ContentInfo wrapping a SignedData with
 * no signers or digest algorithms. Structurally correct per RFC 5652
 * so it parses cleanly, but carries no real signature.
 * Accepted by Xcode Simulator; rejected by real iOS devices.
 *
 * ContentInfo SEQUENCE (35 B)
 *   OID 1.2.840.113549.1.7.2  (signedData)
 *   [0] EXPLICIT
 *     SignedData SEQUENCE (20 B)
 *       version INTEGER 1
 *       digestAlgorithms SET {}
 *       encapContentInfo SEQUENCE
 *         OID 1.2.840.113549.1.7.1  (data)
 *       signerInfos SET {}
 */
const STUB_SIGNATURE = new Uint8Array([
  0x30, 0x23,                                                 // ContentInfo SEQUENCE
  0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01,     // OID signedData
  0x07, 0x02,
  0xa0, 0x16,                                                 // [0] EXPLICIT
  0x30, 0x14,                                                 // SignedData SEQUENCE
  0x02, 0x01, 0x01,                                           // version = 1
  0x31, 0x00,                                                 // digestAlgorithms SET {}
  0x30, 0x0b,                                                 // encapContentInfo SEQUENCE
  0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01,     // OID data
  0x07, 0x01,
  0x31, 0x00,                                                 // signerInfos SET {}
]);

/** Convert an ArrayBuffer to a forge-compatible binary string */
function bufferToBinaryString(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/**
 * Sign manifestJson with the uploaded .p12 certificate using forge.js.
 * Returns a Uint8Array of the DER-encoded detached CMS signature.
 * Throws a user-friendly Error if the cert or password is invalid.
 */
async function signWithP12(manifestJson) {
  const file     = p12File.files[0];
  const password = document.getElementById('p12Password').value;

  // Parse .p12
  let p12;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const asn1 = forge.asn1.fromDer(
      forge.util.createBuffer(bufferToBinaryString(arrayBuffer), 'binary')
    );
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);
  } catch {
    throw new Error('Could not parse .p12 — check the file and password.');
  }

  // Extract certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const cert = certBags[forge.pki.oids.certBag]?.[0]?.cert;
  if (!cert) throw new Error('No certificate found in .p12 file.');

  // Extract private key — try shrouded bag first, then plain key bag
  const shrouded = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  let key = shrouded[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]?.key;
  if (!key) {
    const plain = p12.getBags({ bagType: forge.pki.oids.keyBag });
    key = plain[forge.pki.oids.keyBag]?.[0]?.key;
  }
  if (!key) throw new Error('No private key found in .p12 file.');

  // Build detached CMS SignedData
  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(manifestJson, 'utf8');
  p7.addCertificate(cert);
  p7.addSigner({
    key,
    certificate: cert,
    digestAlgorithm: forge.pki.oids.sha1,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType,  value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime,  value: new Date() },
    ],
  });
  p7.sign({ detached: true });

  const derStr = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return Uint8Array.from(derStr, c => c.charCodeAt(0));
}

/**
 * Return signature bytes for the pass bundle.
 * Real signing if a .p12 is loaded; simulator-only stub otherwise.
 */
async function generateSignature(manifestJson) {
  if (p12File.files[0]) return signWithP12(manifestJson);
  return STUB_SIGNATURE;
}


/* ══════════════════════════════════════════════════════════
   ZIP ASSEMBLY + DOWNLOAD
   ══════════════════════════════════════════════════════════ */

/**
 * Orchestrates the full pass build pipeline and triggers a download:
 *
 *  1. Generate icon blobs (canvas letter or uploaded logo)
 *  2. Serialise pass.json
 *  3. Build file map → compute manifest (SHA-1 of every file)
 *  4. Sign the manifest JSON
 *  5. Pack everything into a JSZip → download as pass.pkpass
 */
const btnIdle    = downloadBtn.querySelector('.btn-idle');
const btnLoading = downloadBtn.querySelector('.btn-loading');

async function buildAndDownload() {
  if (!canGeneratePass()) {
    updateDownloadBtnState();
    updateSignedBtnState();
    return;
  }

  downloadBtn.disabled = true;
  btnIdle.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  downloadNote.textContent = '';

  try {
    /* ── 1. Icons ── */
    const { icon, icon2x } = await generateIconBlobs();

    /* ── 2. pass.json ── */
    const passJson       = buildPassJson();
    const passJsonString = JSON.stringify(passJson);
    const passJsonBytes  = new TextEncoder().encode(passJsonString);

    /* ── 3. Manifest ── */
    // Collect every file that goes into the ZIP so hashes are computed
    // over the exact same bytes that JSZip will store.
    const files = {
      'pass.json':   passJsonBytes,
      'icon.png':    icon,
      'icon@2x.png': icon2x,
    };

    if (state.logoFile) {
      const logoBytes = await state.logoFile.arrayBuffer();
      files['logo.png'] = logoBytes;
    }

    const { manifestJson } = await buildManifest(files);

    /* ── 4. Signature ── */
    const signature = await generateSignature(manifestJson);

    /* ── 5. ZIP ── */
    const zip = new JSZip();

    zip.file('pass.json',     passJsonBytes);
    zip.file('manifest.json', manifestJson);
    zip.file('signature',     signature);
    zip.file('icon.png',      icon);
    zip.file('icon@2x.png',   icon2x);

    if (state.logoFile) zip.file('logo.png', files['logo.png']);

    const blob = await zip.generateAsync({
      type:     'blob',
      mimeType: 'application/vnd.apple.pkpass',
    });

    /* ── Trigger download ── */
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'pass.pkpass';
    link.click();
    URL.revokeObjectURL(url);

    downloadNote.textContent = 'pass.pkpass downloaded.';
  } catch (err) {
    console.error(err);
    downloadNote.textContent = `Error: ${err.message}`;
  } finally {
    btnIdle.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    updateDownloadBtnState();
    updateSignedBtnState();
  }
}

/* ── Wire up the download button ── */
downloadBtn.addEventListener('click', buildAndDownload);


/* ══════════════════════════════════════════════════════════
   START OVER
   ══════════════════════════════════════════════════════════ */

const LUISS_LOGO_DATA_URL = 'data:image/png;base64,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';



const DEFAULTS = {
  orgName:     'Luiss Guido Carli',
  passTitle:   'Luiss Guido Carli',
  field1Label: 'Studente',
  field1Value: '',
  field2Label: 'Matricola',
  field2Value: '',
  bg:          '#15396c',
  fg:          '#ffffff',
  label:       '#7aa3cc',
};

function startOver() {
  // QR upload
  clearUpload();

  // Text fields
  orgNameInput.value      = DEFAULTS.orgName;
  passTitleInput.value    = DEFAULTS.passTitle;
  firstNameInput.value    = '';
  lastNameInput.value     = '';
  field1LabelInput.value  = DEFAULTS.field1Label;
  field1ValueInput.value  = DEFAULTS.field1Value;
  field2LabelInput.value  = DEFAULTS.field2Label;
  field2ValueInput.value  = DEFAULTS.field2Value;

  // Colors
  bgColorInput.value       = DEFAULTS.bg;    bgColorHexInput.value    = DEFAULTS.bg;
  fgColorInput.value       = DEFAULTS.fg;    fgColorHexInput.value    = DEFAULTS.fg;
  labelColorInput.value    = DEFAULTS.label; labelColorHexInput.value = DEFAULTS.label;

  // QR data URL
  state.qrDataUrl          = '';

  // Logo — restore LUISS default
  logoFileInput.value = '';
  loadDefaultLogo();

  // Certificate
  p12File.value                  = '';
  p12FileNameEl.textContent      = 'No file chosen';
  p12PasswordGroup.style.display = 'none';

  updateDownloadBtnState();
  updateSignedBtnState();
  renderPreview();
}

/* ── Load LUISS logo as default ── */
async function loadDefaultLogo() {
  try {
    const resp = await fetch(LUISS_LOGO_DATA_URL);
    const blob = await resp.blob();
    state.logoFile    = new File([blob], 'luiss_logo.png', { type: 'image/png' });
    state.logoDataUrl = LUISS_LOGO_DATA_URL;
    logoFileName.textContent = 'luiss_logo.png';
    renderPreview();
  } catch (e) {
    // fallback: no logo
  }
}

document.getElementById('startOverBtn').addEventListener('click', startOver);


/* ══════════════════════════════════════════════════════════
   WEB PASS EXPORT
   ══════════════════════════════════════════════════════════ */

/** Escape a string for safe embedding in HTML attribute values and text */
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert a Blob to a base64 data URL */
function blobToDataUrl(blob) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(blob);
  });
}

/**
 * Build a fully self-contained HTML string that replicates the pass card.
 * All assets (logo, QR image, touch icon) are inlined as data URLs.
 * When saved and opened in Mobile Safari, the user can "Add to Home Screen"
 * to get a tap-away full-screen pass — no App Store, no certificate needed.
 */
function buildWebPassHtml(iconDataUrl) {
  const orgRaw   = orgNameInput.value.trim()   || 'My Organization';
  const titleRaw = passTitleInput.value.trim() || 'My Pass';

  const org    = escHtml(orgRaw);
  const title  = escHtml(titleRaw);
  const letter = escHtml(orgRaw.charAt(0).toUpperCase());

  const bg = bgColorInput.value;
  const fg = fgColorInput.value;
  const lc = labelColorInput.value;

  const wFirstName = firstNameInput.value.trim();
  const wLastName  = lastNameInput.value.trim();
  const wFullName  = escHtml([wFirstName, wLastName].filter(Boolean).join(' '));

  const f1l   = escHtml(field1LabelInput.value.trim());
  const f1v   = escHtml(field1ValueInput.value.trim() || '—');
  const f2l   = escHtml(field2LabelInput.value.trim());
  const f2v   = escHtml(field2ValueInput.value.trim() || '—');
  const hasF2 = field2LabelInput.value.trim() || field2ValueInput.value.trim();

  const altText = state.barcodeData
    ? escHtml(state.barcodeData.length > 32 ? state.barcodeData.slice(0, 30) + '\u2026' : state.barcodeData)
    : 'Scan to open';

  // Logo: uploaded image or letter avatar
  const logoHtml = state.logoDataUrl
    ? `<img src="${state.logoDataUrl}" style="width:30px;height:30px;border-radius:7px;object-fit:cover;display:block;" alt="">`
    : `<div style="width:30px;height:30px;border-radius:7px;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:${fg};">${letter}</div>`;

  // QR code: uploaded image embedded or placeholder message
  const qrHtml = state.qrDataUrl
    ? `<img src="${state.qrDataUrl}" style="width:160px;height:160px;object-fit:contain;display:block;" alt="QR Code">`
    : `<div style="width:160px;height:160px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#999;">No QR code</div>`;

  // Optional second field
  const field2Html = hasF2
    ? `<div style="display:flex;flex-direction:column;gap:2px;">
        <span style="font-size:9px;font-weight:600;letter-spacing:.08em;color:${lc};text-transform:uppercase;">${f2l || '&nbsp;'}</span>
        <span style="font-size:14px;font-weight:500;color:${fg};">${f2v}</span>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${org}">
<meta name="theme-color" content="${bg}">
<link rel="apple-touch-icon" href="${iconDataUrl}">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:${bg};min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;-webkit-font-smoothing:antialiased}
.pass{background:${bg};border-radius:16px;box-shadow:0 12px 48px rgba(0,0,0,0.6),0 2px 8px rgba(0,0,0,0.35);width:100%;max-width:320px;overflow:hidden;color:${fg}}
.ph{display:flex;align-items:center;gap:8px;padding:14px 16px 10px}
.org{font-size:12px;font-weight:600;opacity:.85;text-transform:uppercase;letter-spacing:.04em;color:${fg}}
.pb{padding:6px 16px 12px}
.pp{margin-bottom:14px}
.ppl{display:block;font-size:9px;font-weight:600;letter-spacing:.08em;color:${lc};margin-bottom:2px;text-transform:uppercase}
.ppv{font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1.2;color:${fg}}
.pf{display:flex;gap:20px}
.pbc{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 16px 18px;border-top:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.15)}
.bb{background:#fff;border-radius:8px;padding:8px;display:inline-flex}
.ba{font-size:10px;opacity:.5;text-align:center;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${fg}}
.hint{margin-top:20px;font-size:11px;opacity:.4;color:${fg};text-align:center;line-height:1.6}
</style>
</head>
<body>
<div class="pass">
  <div class="ph">
    ${logoHtml}
    <span class="org">${org}</span>
  </div>
  <div class="pb">
    <div class="pp">
      <span class="ppl">Title</span>
      <span class="ppv">${title}</span>
    </div>
    ${wFullName ? `<div style="margin-bottom:12px;font-size:1rem;font-weight:600;color:${fg};">${wFullName}</div>` : ''}
    <div class="pf">
      <div style="display:flex;flex-direction:column;gap:2px;">
        <span style="font-size:9px;font-weight:600;letter-spacing:.08em;color:${lc};text-transform:uppercase;">${f1l || '&nbsp;'}</span>
        <span style="font-size:14px;font-weight:500;color:${fg};">${f1v}</span>
      </div>
      ${field2Html}
    </div>
  </div>
  <div class="pbc">
    <div class="bb">${qrHtml}</div>
    <span class="ba">${altText}</span>
  </div>
</div>
<p class="hint">Tap <strong style="opacity:.7">Share</strong> → <strong style="opacity:.7">Add to Home Screen</strong> to save this pass</p>
</body>
</html>`;
}

const webPassBtn = document.getElementById('webPassBtn');

async function buildAndSaveWebPass() {
  webPassBtn.disabled = true;
  try {
    // Generate the home screen touch icon (180 px — Apple's recommended size)
    const iconBlob    = state.logoFile
      ? new Blob([await state.logoFile.arrayBuffer()], { type: state.logoFile.type })
      : await drawLetterIcon(180);
    const iconDataUrl = await blobToDataUrl(iconBlob);

    const html = buildWebPassHtml(iconDataUrl);
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'pass.html';
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    downloadNote.textContent = `Error: ${err.message}`;
  } finally {
    webPassBtn.disabled = false;
  }
}

if (webPassBtn) webPassBtn.addEventListener('click', buildAndSaveWebPass);


/* ══════════════════════════════════════════════════════════
   ONLINE SIGNING  (Cloudflare Worker proxy)
   ══════════════════════════════════════════════════════════ */

const signingStatus     = document.getElementById('signingStatus');
const signingStatusText = document.getElementById('signingStatusText');
const signedBtn         = document.getElementById('signedBtn');
const signedBtnIdle     = signedBtn.querySelector('.btn-idle');
const signedBtnLoading  = signedBtn.querySelector('.btn-loading');

/* Reflect worker availability in the status badge */
function initSigningStatus() {
  if (!WORKER_URL) {
    signingStatus.classList.add('offline');
    signingStatusText.textContent = 'Signing service not configured';
  }

  updateSignedBtnState();
}
initSigningStatus();

/* Enable signed button when worker is configured AND barcode data exists */
function updateSignedBtnState() {
  signedBtn.disabled = !WORKER_URL || !canGeneratePass();
}

/**
 * POST pass data to the Cloudflare Worker proxy, which adds the
 * API key server-side and forwards to WalletWallet.
 */
async function buildAndDownloadSigned() {
  if (!WORKER_URL || !canGeneratePass()) {
    updateDownloadBtnState();
    updateSignedBtnState();
    return;
  }

  signedBtn.disabled = true;
  signedBtnIdle.classList.add('hidden');
  signedBtnLoading.classList.remove('hidden');
  downloadNote.textContent = '';

  try {
    const combinedLabel = [
      field1LabelInput.value.trim() || 'Student',
      field2LabelInput.value.trim() || 'Matricola',
    ].join(' - ');

    const combinedValue = [
      field1ValueInput.value.trim(),
      field2ValueInput.value.trim(),
    ].filter(Boolean).join(' - ');

    const body = {
      barcodeValue:  state.barcodeData,
      barcodeFormat: 'QR',
      title:         passTitleInput.value.trim()   || 'My Pass',
      label:         combinedLabel,
      value:         combinedValue,
      color:         bgColorInput.value,
    };

    const response = await fetch(WORKER_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Signing error ${response.status}: ${text}`);
    }

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'pass.pkpass';
    link.click();
    URL.revokeObjectURL(url);

    downloadNote.textContent = 'Signed pass.pkpass downloaded.';
  } catch (err) {
    console.error(err);
    downloadNote.textContent = `Error: ${err.message}`;
  } finally {
    signedBtnIdle.classList.remove('hidden');
    signedBtnLoading.classList.add('hidden');
    updateDownloadBtnState();
    updateSignedBtnState();
  }
}

signedBtn.addEventListener('click', buildAndDownloadSigned);
