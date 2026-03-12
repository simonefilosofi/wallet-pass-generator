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
  renderPreview();
}

function setDecodeError() {
  state.barcodeData = '';
  barcodeDataInput.value = '';
  hide(decodeResult);
  show(decodeError);
  downloadBtn.disabled = true;
  downloadNote.textContent = 'Upload a QR code image to enable download.';
  renderPreview();
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
const passTitlePreview  = document.getElementById('passTitlePreview');
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
const presetBtns         = document.querySelectorAll('.preset');
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

  // Title
  passTitlePreview.textContent = passTitleInput.value.trim() || 'My Pass';

  // Secondary field 1 (always visible)
  passField1LabelEl.textContent = (field1LabelInput.value.trim() || 'Field').toUpperCase();
  passField1ValueEl.textContent =  field1ValueInput.value.trim() || '—';

  // Secondary field 2 — show only when user has typed something
  const has2 = field2LabelInput.value.trim() || field2ValueInput.value.trim();
  if (has2) {
    passField2.classList.remove('hidden');
    passField2LabelEl.textContent = field2LabelInput.value.trim().toUpperCase();
    passField2ValueEl.textContent = field2ValueInput.value.trim() || '—';
  } else {
    passField2.classList.add('hidden');
  }

  // Barcode alt text — show decoded data (truncated) or fallback
  const alt = state.barcodeData;
  barcodeAltPreview.textContent = alt
    ? (alt.length > 28 ? alt.slice(0, 26) + '\u2026' : alt)
    : 'Scan to open';

  // Redraw QR placeholder canvas
  drawQrPlaceholder();
}

/* ── Color picker ↔ hex input sync ── */
function isValidHex(v) { return /^#[0-9a-fA-F]{6}$/.test(v); }

function syncFromPicker(picker, hexInput) {
  hexInput.value = picker.value;
  renderPreview();
}

function syncFromHex(hexInput, picker) {
  let v = hexInput.value.trim();
  if (v.length > 0 && v[0] !== '#') { v = '#' + v; hexInput.value = v; }
  if (isValidHex(v)) { picker.value = v; renderPreview(); }
}

bgColorInput.addEventListener('input',    () => syncFromPicker(bgColorInput,    bgColorHexInput));
fgColorInput.addEventListener('input',    () => syncFromPicker(fgColorInput,    fgColorHexInput));
labelColorInput.addEventListener('input', () => syncFromPicker(labelColorInput, labelColorHexInput));

bgColorHexInput.addEventListener('input',    () => syncFromHex(bgColorHexInput,    bgColorInput));
fgColorHexInput.addEventListener('input',    () => syncFromHex(fgColorHexInput,    fgColorInput));
labelColorHexInput.addEventListener('input', () => syncFromHex(labelColorHexInput, labelColorInput));

/* ── Preset buttons ── */
presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const bg    = btn.dataset.bg;
    const fg    = btn.dataset.fg;
    const label = btn.dataset.label;

    bgColorInput.value       = bg;    bgColorHexInput.value    = bg;
    fgColorInput.value       = fg;    fgColorHexInput.value    = fg;
    labelColorInput.value    = label; labelColorHexInput.value = label;

    presetBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPreview();
  });
});

/* ── Text input → re-render ── */
[orgNameInput, passTitleInput,
 field1LabelInput, field1ValueInput,
 field2LabelInput, field2ValueInput].forEach(el => el.addEventListener('input', renderPreview));

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
      primaryFields: [
        { key: 'title', label: '', value: title },
      ],
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
  const buffer = source instanceof ArrayBuffer ? source : await source.arrayBuffer();
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
async function buildAndDownload() {
  downloadBtn.disabled = true;
  downloadNote.textContent = 'Building pass…';

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
    downloadBtn.disabled = !state.barcodeData.trim();
  }
}

/* ── Wire up the download button ── */
downloadBtn.addEventListener('click', buildAndDownload);
