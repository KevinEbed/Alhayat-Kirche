/* ═══════════════════════════════════════════════
   Al Hayat Kirche — Admin Panel JavaScript
═══════════════════════════════════════════════ */

const API = '';

// ── BroadcastChannel for syncing with main page ──
let syncChannel = null;
try {
  syncChannel = new BroadcastChannel('alhayat-sync');
} catch (e) { /* fallback below */ }

function notifyMainPage() {
  // Notify via BroadcastChannel (same-origin tabs)
  if (syncChannel) {
    syncChannel.postMessage({ type: 'content-updated' });
  }
  // Fallback: localStorage event (fires in other tabs)
  localStorage.setItem('alhayat-data-updated', Date.now().toString());
}

// ── State ─────────────────────────────────────
const admin = {
  user: null,
  events: [],
  gallery: [],
  videos: [],
  content: {},
  activePanel: 'events',
  activeSection: 'home',
  sectionsPage: 'home',
  // Special event image upload state
  _pendingImageFile: null,   // File object awaiting upload with Save Event
  _pendingImageUrl:  null,   // Server URL returned after upload (set during saveEvent)
};
const pendingGalleryFiles = {};

// ── Init ──────────────────────────────────────
async function init() {
  const res = await fetch(`${API}/api/auth/check`).then(r => r.json()).catch(() => ({ loggedIn: false }));
  if (res.loggedIn) {
    admin.user = res.username;
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminApp').classList.add('hidden');
  setupLoginForm();
}

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminApp').classList.remove('hidden');
  document.getElementById('topbarUser').textContent = admin.user || '';
  setupSidebar();
  loadAllData().then(() => {
    navigatePanel(admin.activePanel);
  });
}

// ── Auth ──────────────────────────────────────
function setupLoginForm() {
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
}

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(r => r.json());
    if (res.success) {
      admin.user = res.username;
      showApp();
    } else {
      errEl.textContent = 'Invalid username or password.';
      errEl.classList.remove('hidden');
    }
  } catch {
    errEl.textContent = 'Connection error. Is the server running?';
    errEl.classList.remove('hidden');
  }
}

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
  showLogin();
});

// ── Data ──────────────────────────────────────
async function loadAllData() {
  const [events, gallery, videos, content] = await Promise.all([
    fetch(`${API}/api/events`).then(r => r.json()).catch(() => []),
    fetch(`${API}/api/gallery`).then(r => r.json()).catch(() => []),
    fetch(`${API}/api/videos`).then(r => r.json()).catch(() => []),
    fetch(`${API}/api/content`).then(r => r.json()).catch(() => ({})),
  ]);
  admin.events = events;
  admin.gallery = gallery;
  admin.videos = videos;
  admin.content = content;
}

// ── Sidebar / Navigation ──────────────────────
function setupSidebar() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigatePanel(item.dataset.panel));
  });
}

function navigatePanel(panel) {
  admin.activePanel = panel;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.panel === panel));
  document.querySelectorAll('.panel').forEach(p => { p.style.display = 'none'; p.classList.remove('active'); });
  const el = document.getElementById(`panel-${panel}`);
  if (el) { el.style.display = 'block'; el.classList.add('active'); }
  document.getElementById('topbarTitle').textContent = panel.charAt(0).toUpperCase() + panel.slice(1);

  if (panel === 'events') renderEventsTable();
  if (panel === 'media') { setupMediaPanel(); renderAlbums(); renderVideosList(); }
  if (panel === 'content') renderContentEditor();
  if (panel === 'sections') renderSectionsPanel();
}

// ═══════════════════════════════════════════════
// ── EVENTS ─────────────────────────────────────
// ═══════════════════════════════════════════════
function setupEventsPanel() {
  document.getElementById('addEventBtn').addEventListener('click', () => openEventForm());
  document.getElementById('saveEventBtn').addEventListener('click', saveEvent);
  document.getElementById('cancelEventBtn').addEventListener('click', closeEventForm);

  // Clear field-invalid highlight as soon as the user starts correcting
  ['eventTitleDe', 'eventTitleAr', 'eventTime', 'eventStartDate'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', function() {
      this.classList.remove('field-invalid');
      // Hide error banner if all highlighted fields are now valid
      if (!document.querySelector('.field-invalid')) {
        document.getElementById('eventValidationError')?.classList.add('hidden');
      }
    });
  });

  document.getElementById('eventRecurring').addEventListener('change', e => {
    if (e.target.checked) {
      // Recurring: hide dates, show day-of-week, uncheck special
      document.getElementById('eventIsSpecial').checked = false;
      document.getElementById('eventImageGroup').style.display = 'none';
      document.getElementById('eventStartDateGroup').style.display = 'none';
      document.getElementById('eventEndDateGroup').style.display = 'none';
      document.getElementById('eventRecurringDayGroup').style.display = 'block';
    } else {
      document.getElementById('eventStartDateGroup').style.display = 'block';
      document.getElementById('eventEndDateGroup').style.display = 'block';
      document.getElementById('eventRecurringDayGroup').style.display = 'none';
    }
  });

  document.getElementById('eventIsSpecial').addEventListener('change', e => {
    const isSpecial = e.target.checked;
    if (isSpecial) {
      // Special: uncheck recurring, show dates + image, hide day-of-week
      document.getElementById('eventRecurring').checked = false;
      document.getElementById('eventRecurringDayGroup').style.display = 'none';
      document.getElementById('eventStartDateGroup').style.display = 'block';
      document.getElementById('eventEndDateGroup').style.display = 'block';
    }
    const show = isSpecial ? 'block' : 'none';
    document.getElementById('eventImageGroup').style.display = show;
    if (!isSpecial) resetEventImageUI(); // clear image state when special is unchecked
  });

  // ── Image drop zone (Step 1: select file) ───────
  const imageDrop = document.getElementById('eventImageDrop');
  const imageFileEl = document.getElementById('eventImageFile');
  if (imageDrop && imageFileEl) {
    imageDrop.addEventListener('click', () => imageFileEl.click());
    imageDrop.addEventListener('dragover', e => { e.preventDefault(); imageDrop.classList.add('drag-over'); });
    imageDrop.addEventListener('dragleave', () => imageDrop.classList.remove('drag-over'));
    imageDrop.addEventListener('drop', e => {
      e.preventDefault(); imageDrop.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) {
        imageFileEl.files = e.dataTransfer.files;
        onEventImageSelected();
      }
    });
    imageFileEl.addEventListener('change', onEventImageSelected);
  }

  // ── Upload Image button (Step 2: confirm selection) ─
  document.getElementById('uploadImageBtn')?.addEventListener('click', confirmEventImageUpload);
}

// Called when user picks a file (Step 1 complete)
function onEventImageSelected() {
  const file = document.getElementById('eventImageFile')?.files[0];
  if (!file) return;
  admin._pendingImageFile = file;
  admin._pendingImageUrl  = null; // reset any previous upload

  // Update drop zone label
  const label = document.getElementById('eventImageDropLabel');
  if (label) label.textContent = `Selected: ${file.name}`;

  // Show the Upload Image button (Step 2)
  const actions = document.getElementById('eventImageActions');
  if (actions) actions.style.display = 'flex';

  const btn = document.getElementById('uploadImageBtn');
  if (btn) {
    btn.textContent = '↑ Upload Image';
    btn.classList.remove('uploaded');
    btn.disabled = false;
  }

  const status = document.getElementById('eventImageUploadStatus');
  if (status) status.textContent = 'Click "Upload Image" to confirm';

  // Show local preview immediately
  const preview = document.getElementById('eventImagePreview');
  if (preview) {
    const url = URL.createObjectURL(file);
    preview.innerHTML = `<img src="${url}" alt="preview" style="max-width:220px;max-height:160px;border-radius:6px;object-fit:cover;border:2px dashed #ccc"/>`;
  }
}

// Called when user clicks "Upload Image" button (Step 2 — confirms, marks as ready)
function confirmEventImageUpload() {
  const file = admin._pendingImageFile;
  if (!file) { toast('Select an image first'); return; }

  const btn = document.getElementById('uploadImageBtn');
  const status = document.getElementById('eventImageUploadStatus');
  const preview = document.getElementById('eventImagePreview');

  // Mark as confirmed — actual server upload happens inside saveEvent()
  btn.textContent = '✓ Image ready';
  btn.classList.add('uploaded');
  btn.disabled = true;

  if (status) status.textContent = 'Image will be saved with the event.';

  // Show preview with "ready" indicator
  if (preview && file) {
    const url = URL.createObjectURL(file);
    preview.innerHTML = `
      <div style="position:relative;display:inline-block">
        <img src="${url}" alt="preview" style="max-width:220px;max-height:160px;border-radius:6px;object-fit:cover;border:2px solid var(--green)"/>
        <span style="position:absolute;bottom:6px;left:6px;background:rgba(46,125,50,0.9);color:#fff;font-size:0.7rem;padding:2px 8px;border-radius:4px">Ready to save</span>
      </div>`;
  }
}

// Reset image upload state (called on form open/close)
function resetEventImageUI() {
  admin._pendingImageFile = null;
  admin._pendingImageUrl  = null;

  const imageFileEl = document.getElementById('eventImageFile');
  if (imageFileEl) imageFileEl.value = '';

  const label = document.getElementById('eventImageDropLabel');
  if (label) label.textContent = 'Step 1 — Click or drag to select image (JPG, PNG)';

  const actions = document.getElementById('eventImageActions');
  if (actions) actions.style.display = 'none';

  const btn = document.getElementById('uploadImageBtn');
  if (btn) { btn.textContent = '↑ Upload Image'; btn.classList.remove('uploaded'); btn.disabled = false; }

  const status = document.getElementById('eventImageUploadStatus');
  if (status) status.textContent = '';

  const preview = document.getElementById('eventImagePreview');
  if (preview) preview.innerHTML = '';
}

function renderEventsTable() {
  const tbody = document.getElementById('eventsBody');
  tbody.innerHTML = admin.events.map(ev => {
    const start = ev.startDate || ev.date || '';
    const end   = ev.endDate   || ev.startDate || ev.date || '';
    const dateRange = !ev.recurring && start
      ? `<br><small style="color:#888">${start}${end && end !== start ? ' → ' + end : ''}</small>` : '';
    return `
    <tr>
      <td>${ev.title_de || ''}</td>
      <td dir="rtl">${ev.title_ar || ''}</td>
      <td>${ev.time || ''}${ev.endTime ? ' – ' + ev.endTime : ''}${dateRange}</td>
      <td>${ev.type === 'special'
        ? `<span class="badge badge-gold">Special</span>`
        : ev.recurring
          ? `<span class="badge badge-green">Recurring</span>`
          : `<span class="badge badge-gray">One-time</span>`}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-outline" onclick="openEventForm('${ev.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEvent('${ev.id}')">Delete</button>
        </div>
      </td>
    </tr>
  `;}).join('') || `<tr><td colspan="5" style="text-align:center;color:#888;padding:20px">No events yet.</td></tr>`;
}

function openEventForm(id = null) {
  const form = document.getElementById('eventForm');
  form.classList.remove('hidden');
  document.getElementById('eventFormTitle').textContent = id ? 'Edit Event' : 'New Event';
  document.getElementById('eventId').value = id || '';

  if (id) {
    const ev = admin.events.find(e => e.id === id);
    if (!ev) return;
    const isSpecial = ev.type === 'special';
    document.getElementById('eventTitleDe').value = ev.title_de || '';
    document.getElementById('eventTitleAr').value = ev.title_ar || '';
    document.getElementById('eventDescDe').value = ev.description_de || '';
    document.getElementById('eventDescAr').value = ev.description_ar || '';
    document.getElementById('eventTime').value = ev.time || '';
    document.getElementById('eventEndTime').value = ev.endTime || '';
    document.getElementById('eventColor').value = ev.color || '#2e7d32';
    document.getElementById('eventIsSpecial').checked = isSpecial;
    document.getElementById('eventRecurring').checked = !!ev.recurring;
    document.getElementById('eventRecurringDay').value = ev.recurringDay ?? 0;
    document.getElementById('eventRecurringDayGroup').style.display = ev.recurring ? 'block' : 'none';
    const dateVis = ev.recurring ? 'none' : 'block';
    document.getElementById('eventStartDateGroup').style.display = dateVis;
    document.getElementById('eventEndDateGroup').style.display = dateVis;
    document.getElementById('eventStartDate').value = ev.startDate || ev.date || '';
    document.getElementById('eventEndDate').value = ev.endDate && ev.endDate !== ev.startDate ? ev.endDate : '';
    document.getElementById('eventImageGroup').style.display = isSpecial ? 'block' : 'none';
    resetEventImageUI();
    // Show existing image if editing a special event with an image
    if (isSpecial && ev.imageUrl) {
      document.getElementById('eventImageCurrent').textContent = '';
      const preview = document.getElementById('eventImagePreview');
      if (preview) {
        preview.innerHTML = `
          <div style="position:relative;display:inline-block">
            <img src="${ev.imageUrl}" alt="current poster" style="max-width:220px;max-height:160px;border-radius:6px;object-fit:cover;border:2px solid var(--green)"/>
            <span style="position:absolute;bottom:6px;left:6px;background:rgba(46,125,50,0.9);color:#fff;font-size:0.7rem;padding:2px 8px;border-radius:4px">Current image</span>
          </div>
          <p style="font-size:0.78rem;color:#888;margin-top:4px">Select a new image above to replace it.</p>`;
      }
      // Keep the existing URL so save doesn't wipe it if no new file is chosen
      admin._pendingImageUrl = ev.imageUrl;
    }
  } else {
    document.getElementById('eventTitleDe').value = '';
    document.getElementById('eventTitleAr').value = '';
    document.getElementById('eventDescDe').value = '';
    document.getElementById('eventDescAr').value = '';
    document.getElementById('eventTime').value = '';
    document.getElementById('eventEndTime').value = '';
    document.getElementById('eventColor').value = '#2e7d32';
    document.getElementById('eventIsSpecial').checked = false;
    document.getElementById('eventRecurring').checked = false;
    document.getElementById('eventRecurringDay').value = 0;
    document.getElementById('eventRecurringDayGroup').style.display = 'none';
    document.getElementById('eventStartDateGroup').style.display = 'block';
    document.getElementById('eventEndDateGroup').style.display = 'block';
    document.getElementById('eventStartDate').value = '';
    document.getElementById('eventEndDate').value = '';
    document.getElementById('eventImageGroup').style.display = 'none';
    resetEventImageUI();
  }
  clearEventValidation();
  form.scrollIntoView({ behavior: 'smooth' });
}

function closeEventForm() {
  document.getElementById('eventForm').classList.add('hidden');
  clearEventValidation();
  resetEventImageUI();
}

// ── Event form validation ──────────────────────
function validateEventForm() {
  const isRecurring = document.getElementById('eventRecurring').checked;
  const isSpecial   = document.getElementById('eventIsSpecial').checked;

  const fields = [
    { id: 'eventTitleDe', label: 'Title (German)',  check: v => v.trim() !== '' },
    { id: 'eventTitleAr', label: 'Title (Arabic)',  check: v => v.trim() !== '' },
    { id: 'eventTime',    label: 'Start Time',       check: v => /^\d{2}:\d{2}$/.test(v) },
  ];

  // Date is required for non-recurring events
  if (!isRecurring) {
    fields.push({ id: 'eventStartDate', label: 'Start Date', check: v => v !== '' });
  }

  // Clear previous highlights
  clearEventValidation();

  const missing = [];
  fields.forEach(f => {
    const el = document.getElementById(f.id);
    if (!el) return;
    if (!f.check(el.value)) {
      missing.push(f.label);
      el.classList.add('field-invalid');
    }
  });

  if (missing.length) {
    const errEl = document.getElementById('eventValidationError');
    errEl.textContent = `Required fields missing: ${missing.join(', ')}`;
    errEl.classList.remove('hidden');
    errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return false;
  }
  return true;
}

function clearEventValidation() {
  const errEl = document.getElementById('eventValidationError');
  if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
  ['eventTitleDe', 'eventTitleAr', 'eventTime', 'eventStartDate'].forEach(id => {
    document.getElementById(id)?.classList.remove('field-invalid');
  });
}

async function saveEvent() {
  if (!validateEventForm()) return;   // ← stop if required fields are missing

  const id = document.getElementById('eventId').value;
  const isSpecial = document.getElementById('eventIsSpecial').checked;
  const startDate = document.getElementById('eventStartDate').value;
  const endDate   = document.getElementById('eventEndDate').value;
  // Image file is read from admin state (set by onEventImageSelected → confirmEventImageUpload)

  const data = {
    title_de:       document.getElementById('eventTitleDe').value.trim(),
    title_ar:       document.getElementById('eventTitleAr').value.trim(),
    description_de: document.getElementById('eventDescDe').value.trim(),
    description_ar: document.getElementById('eventDescAr').value.trim(),
    time:           document.getElementById('eventTime').value,
    endTime:        document.getElementById('eventEndTime').value,
    color:          document.getElementById('eventColor').value,
    recurring:      !isSpecial && document.getElementById('eventRecurring').checked,
    recurringDay:   parseInt(document.getElementById('eventRecurringDay').value),
    type:           isSpecial ? 'special' : (document.getElementById('eventRecurring').checked ? 'recurring' : 'onetime'),
    startDate,
    endDate:        endDate || '',           // empty = single-day; frontend falls back to startDate
    date:           startDate,               // legacy field for backward-compat
  };

  const url = id ? `${API}/api/events/${id}` : `${API}/api/events`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()).catch(() => null);

  if (!res) { toast('Save failed — check server'); return; }

  const savedId = res.id || id;

  // ── Step 2: Upload image if a file was confirmed (Step 2 button clicked) ──
  // Use admin._pendingImageFile set during onEventImageSelected/confirmEventImageUpload
  const fileToUpload = admin._pendingImageFile;

  if (isSpecial && fileToUpload && savedId) {
    try {
      const imgForm = new FormData();
      imgForm.append('image', fileToUpload);
      const imgRes = await fetch(`${API}/api/events/${savedId}/image`, {
        method: 'POST', credentials: 'include', body: imgForm
      }).then(r => r.json()).catch(() => null);

      // Normalise response: backend may return imageUrl, url, or path
      const uploadedUrl = imgRes
        ? (imgRes.imageUrl || imgRes.url || imgRes.path || null)
        : null;

      if (uploadedUrl) {
        data.imageUrl = uploadedUrl;

        // ── CRITICAL FIX: patch the event record with the imageUrl ──────────
        // The event was created/updated first (without imageUrl). Now that we
        // have the URL, do a second PUT so the DB record stores it. Without this,
        // GET /api/events never returns imageUrl, and the frontend can't show it.
        await fetch(`${API}/api/events/${savedId}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, id: savedId, imageUrl: uploadedUrl })
        }).catch(() => null); // non-fatal: event is saved, image patch is best-effort
      }
    } catch { /* image upload is optional — event is still saved */ }
  } else if (isSpecial && admin._pendingImageUrl) {
    // Editing: keep the existing imageUrl if no new file was chosen
    data.imageUrl = admin._pendingImageUrl;
  }

  // Update local admin state immediately so the table reflects the save
  if (!id) {
    admin.events.push({ ...data, id: savedId });
  } else {
    const idx = admin.events.findIndex(e => e.id === id);
    if (idx >= 0) admin.events[idx] = { ...data, id };
  }

  closeEventForm(); // also calls resetEventImageUI()
  renderEventsTable();
  toast('Event saved ✓');
  // Notify frontend — triggers loadAllData() + renderAll() including renderSpecialEvents()
  notifyMainPage();
}

async function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  await fetch(`${API}/api/events/${id}`, { method: 'DELETE', credentials: 'include' });
  admin.events = admin.events.filter(e => e.id !== id);
  renderEventsTable();
  toast('Event deleted');
  notifyMainPage();
}

// ═══════════════════════════════════════════════
// ── MEDIA (Photos + Videos combined) ───────────
// ═══════════════════════════════════════════════
let _mediaPanelSetup = false;

function setupMediaPanel() {
  if (_mediaPanelSetup) return;
  _mediaPanelSetup = true;

  // Internal tab switching (Photos ↔ Videos)
  document.querySelectorAll('[data-media-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-media-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.mediaTab;
      document.getElementById('media-sub-photos').style.display = tab === 'photos' ? '' : 'none';
      document.getElementById('media-sub-videos').style.display = tab === 'videos' ? '' : 'none';
    });
  });

  // Photos setup (album CRUD)
  document.getElementById('addAlbumBtn').addEventListener('click', () => openAlbumForm());
  document.getElementById('saveAlbumBtn').addEventListener('click', saveAlbum);
  document.getElementById('cancelAlbumBtn').addEventListener('click', () => {
    document.getElementById('albumForm').classList.add('hidden');
  });

  // Videos setup (upload + file drop)
  setupVideosPanel();
}

// ── GALLERY ────────────────────────────────────

function renderAlbums() {
  const container = document.getElementById('albumsList');
  if (!admin.gallery.length) {
    container.innerHTML = '<p style="color:#888;text-align:center;padding:32px">No albums yet. Create one above.</p>';
    return;
  }
  container.innerHTML = admin.gallery.map(album => {
    const title = `${album.title_de || ''}${album.title_ar ? ' / ' + album.title_ar : ''}`;
    const imgsHtml = album.images.map(img => `
      <div class="admin-img-wrap">
        <img src="${img.url}" loading="lazy"/>
        <button class="img-delete-btn" onclick="deleteImage('${album.id}','${img.id}')" title="Delete">×</button>
      </div>
    `).join('');

    return `<div class="album-section">
      <div class="album-head">
        <div class="album-head-title">${title} <span style="color:#888;font-size:0.78rem">(${album.images.length} images)</span></div>
        <div class="album-head-actions">
          <button class="btn btn-sm btn-outline" onclick="openAlbumForm('${album.id}')">Edit Title</button>
          <button class="btn btn-sm btn-danger" onclick="deleteAlbum('${album.id}')">Delete Album</button>
        </div>
      </div>
      <div class="album-body">
        <div class="album-images-grid">${imgsHtml}</div>
        <div class="file-drop" id="drop-${album.id}" data-album="${album.id}">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          <p>Click or drag to select images</p>
          <input type="file" multiple accept="image/*" hidden id="imgInput-${album.id}"/>
        </div>
        <div class="gallery-preview" id="preview-${album.id}"></div>
        <button class="btn btn-primary gallery-upload-btn hidden" id="upload-btn-${album.id}" onclick="uploadPendingImages('${album.id}')">Upload Images</button>
      </div>
    </div>`;
  }).join('');

  // Setup file drops
  admin.gallery.forEach(album => {
    const drop = document.getElementById(`drop-${album.id}`);
    const input = document.getElementById(`imgInput-${album.id}`);
    if (!drop || !input) return;

    drop.addEventListener('click', () => input.click());
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag-over');
      selectGalleryFiles(album.id, Array.from(e.dataTransfer.files));
    });
    input.addEventListener('change', () => {
      selectGalleryFiles(album.id, Array.from(input.files));
      input.value = '';
    });
    // Restore preview if pending files exist
    if (pendingGalleryFiles[album.id]?.length) showGalleryPreview(album.id);
  });
}

function openAlbumForm(id = null) {
  const form = document.getElementById('albumForm');
  form.classList.remove('hidden');
  document.getElementById('albumFormTitle').textContent = id ? 'Edit Album' : 'New Album';
  document.getElementById('albumId').value = id || '';
  if (id) {
    const album = admin.gallery.find(a => a.id === id);
    document.getElementById('albumTitleDe').value = album?.title_de || '';
    document.getElementById('albumTitleAr').value = album?.title_ar || '';
  } else {
    document.getElementById('albumTitleDe').value = '';
    document.getElementById('albumTitleAr').value = '';
  }
}

async function saveAlbum() {
  const id = document.getElementById('albumId').value;
  const data = {
    title_de: document.getElementById('albumTitleDe').value.trim(),
    title_ar: document.getElementById('albumTitleAr').value.trim(),
  };
  const url = id ? `${API}/api/gallery/albums/${id}` : `${API}/api/gallery/albums`;
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method, credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()).catch(() => null);

  if (res) {
    if (!id) admin.gallery.push(res);
    else { const idx = admin.gallery.findIndex(a => a.id === id); if (idx >= 0) Object.assign(admin.gallery[idx], data); }
    document.getElementById('albumForm').classList.add('hidden');
    renderAlbums();
    toast('Album saved ✓');
    notifyMainPage();
  }
}

async function deleteAlbum(id) {
  if (!confirm('Delete this entire album and all its images?')) return;
  await fetch(`${API}/api/gallery/albums/${id}`, { method: 'DELETE', credentials: 'include' });
  admin.gallery = admin.gallery.filter(a => a.id !== id);
  renderAlbums();
  toast('Album deleted');
  notifyMainPage();
}

async function uploadImages(albumId, files) {
  if (!files.length) return;
  const formData = new FormData();
  Array.from(files).forEach(f => formData.append('images', f));
  toast('Uploading...');
  try {
    const newImgs = await fetch(`${API}/api/gallery/albums/${albumId}/images`, {
      method: 'POST', credentials: 'include', body: formData
    }).then(r => r.json());
    const album = admin.gallery.find(a => a.id === albumId);
    if (album) album.images.push(...newImgs);
    renderAlbums();
    toast(`${newImgs.length} image(s) uploaded ✓`);
    notifyMainPage();
  } catch (e) {
    toast('Upload failed: ' + e.message);
  }
}

function selectGalleryFiles(albumId, files) {
  if (!files.length) return;
  pendingGalleryFiles[albumId] = (pendingGalleryFiles[albumId] || []).concat(files);
  showGalleryPreview(albumId);
}

function showGalleryPreview(albumId) {
  const files = pendingGalleryFiles[albumId] || [];
  const previewEl = document.getElementById(`preview-${albumId}`);
  const uploadBtn = document.getElementById(`upload-btn-${albumId}`);
  if (!previewEl) return;
  previewEl.innerHTML = files.map(f => {
    const url = URL.createObjectURL(f);
    return `<div class="admin-img-wrap" style="border:2px solid var(--green)"><img src="${url}" loading="lazy" style="width:100%;height:100%;object-fit:cover"/></div>`;
  }).join('');
  if (uploadBtn) {
    if (files.length > 0) {
      uploadBtn.classList.remove('hidden');
      uploadBtn.textContent = `Upload ${files.length} image(s)`;
    } else {
      uploadBtn.classList.add('hidden');
    }
  }
}

async function uploadPendingImages(albumId) {
  const files = pendingGalleryFiles[albumId];
  if (!files || !files.length) return;
  await uploadImages(albumId, files);
  pendingGalleryFiles[albumId] = [];
}

async function deleteImage(albumId, imageId) {
  if (!confirm('Delete this image?')) return;
  await fetch(`${API}/api/gallery/albums/${albumId}/images/${imageId}`, { method: 'DELETE', credentials: 'include' });
  const album = admin.gallery.find(a => a.id === albumId);
  if (album) album.images = album.images.filter(i => i.id !== imageId);
  renderAlbums();
  toast('Image deleted');
  notifyMainPage();
}

// ═══════════════════════════════════════════════
// ── VIDEOS ─────────────────────────────────────
// ═══════════════════════════════════════════════
function setupVideosPanel() {
  const drop = document.getElementById('videoDrop');
  const input = document.getElementById('videoFile');

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', e => {
    e.preventDefault(); drop.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      document.getElementById('videoFileName').textContent = e.dataTransfer.files[0].name;
    }
  });
  input.addEventListener('change', () => {
    document.getElementById('videoFileName').textContent = input.files[0]?.name || '';
  });

  document.getElementById('uploadVideoBtn').addEventListener('click', uploadVideo);
}

function renderVideosList() {
  const el = document.getElementById('videosList');
  if (!admin.videos.length) {
    el.innerHTML = '<p style="color:#888;text-align:center;padding:20px">No videos yet.</p>';
    return;
  }
  el.innerHTML = admin.videos.map(v => `
    <div class="video-list-item" id="vitem-${v.id}">
      <div class="video-list-thumb ${v.isUrl?'url-thumb':''}">
        ${v.isUrl
          ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" stroke-width="1.5"><polygon points="5,3 19,12 5,21"/></svg>`
          : `<video src="${v.url}" preload="metadata"></video>`}
      </div>
      <div class="video-list-info" id="vview-${v.id}">
        <div class="video-list-title">${v.title_de || 'Video'}</div>
        <div class="video-list-meta" dir="rtl">${v.title_ar || ''}</div>
        ${v.description_de ? `<div style="font-size:0.78rem;color:#888;margin-top:2px">${v.description_de}</div>` : ''}
      </div>
      <div class="video-edit-form hidden" id="vedit-${v.id}" style="flex:1">
        <div class="form-grid" style="margin-bottom:0">
          <div class="form-group"><label>Title DE</label><input type="text" id="vedit-tde-${v.id}" value="${(v.title_de||'').replace(/"/g,'&quot;')}"/></div>
          <div class="form-group"><label>Title AR</label><input type="text" id="vedit-tar-${v.id}" value="${(v.title_ar||'').replace(/"/g,'&quot;')}" dir="rtl"/></div>
          <div class="form-group"><label>Desc DE</label><input type="text" id="vedit-dde-${v.id}" value="${(v.description_de||'').replace(/"/g,'&quot;')}"/></div>
          <div class="form-group"><label>Desc AR</label><input type="text" id="vedit-dar-${v.id}" value="${(v.description_ar||'').replace(/"/g,'&quot;')}" dir="rtl"/></div>
        </div>
      </div>
      <div class="row-actions" style="flex-shrink:0">
        <button class="btn btn-sm btn-outline" id="vedit-btn-${v.id}" onclick="toggleVideoEdit('${v.id}')">Edit</button>
        <button class="btn btn-sm btn-primary hidden" id="vsave-btn-${v.id}" onclick="saveVideoEdit('${v.id}')">Save</button>
        <button class="btn btn-sm btn-danger" onclick="deleteVideo('${v.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function toggleVideoEdit(id) {
  const editForm = document.getElementById(`vedit-${id}`);
  const viewDiv  = document.getElementById(`vview-${id}`);
  const editBtn  = document.getElementById(`vedit-btn-${id}`);
  const saveBtn  = document.getElementById(`vsave-btn-${id}`);
  const isEditing = !editForm.classList.contains('hidden');
  if (isEditing) {
    editForm.classList.add('hidden'); viewDiv.classList.remove('hidden');
    editBtn.textContent = 'Edit'; saveBtn.classList.add('hidden');
  } else {
    editForm.classList.remove('hidden'); viewDiv.classList.add('hidden');
    editBtn.textContent = 'Cancel'; saveBtn.classList.remove('hidden');
  }
}

async function saveVideoEdit(id) {
  const video = admin.videos.find(v => v.id === id);
  if (!video) return;
  const updated = {
    ...video,
    title_de: document.getElementById(`vedit-tde-${id}`).value,
    title_ar: document.getElementById(`vedit-tar-${id}`).value,
    description_de: document.getElementById(`vedit-dde-${id}`).value,
    description_ar: document.getElementById(`vedit-dar-${id}`).value,
  };
  const res = await fetch(`${API}/api/videos/${id}`, {
    method: 'PUT', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  }).then(r => r.json()).catch(() => null);
  if (res?.success) {
    Object.assign(video, updated);
    renderVideosList();
    toast('Video updated ✓');
    notifyMainPage();
  } else {
    toast('Update failed');
  }
}

async function uploadVideo() {
  const input = document.getElementById('videoFile');
  if (!input.files[0]) { toast('Please select a video file.'); return; }

  const formData = new FormData();
  formData.append('video', input.files[0]);
  formData.append('title_de', document.getElementById('videoTitleDe').value);
  formData.append('title_ar', document.getElementById('videoTitleAr').value);
  formData.append('description_de', document.getElementById('videoDescDe').value);
  formData.append('description_ar', document.getElementById('videoDescAr').value);

  const progress = document.getElementById('videoProgress');
  const fill = document.getElementById('videoProgressFill');
  const label = document.getElementById('videoProgressLabel');
  progress.classList.remove('hidden');

  // XHR for progress
  const xhr = new XMLHttpRequest();
  xhr.upload.onprogress = e => {
    if (e.lengthComputable) {
      const pct = Math.round((e.loaded / e.total) * 100);
      fill.style.width = pct + '%';
      label.textContent = `Uploading... ${pct}%`;
    }
  };
  xhr.onload = () => {
    progress.classList.add('hidden');
    if (xhr.status === 200) {
      const newVideo = JSON.parse(xhr.responseText);
      admin.videos.push(newVideo);
      renderVideosList();
      toast('Video uploaded ✓');
      notifyMainPage();
      input.value = '';
      document.getElementById('videoFileName').textContent = '';
      document.getElementById('videoTitleDe').value = '';
      document.getElementById('videoTitleAr').value = '';
      document.getElementById('videoDescDe').value = '';
      document.getElementById('videoDescAr').value = '';
    } else {
      toast('Upload failed');
    }
  };
  xhr.onerror = () => { progress.classList.add('hidden'); toast('Upload error'); };
  xhr.open('POST', `${API}/api/videos`);
  xhr.withCredentials = true;
  xhr.send(formData);
}

async function deleteVideo(id) {
  if (!confirm('Delete this video?')) return;
  await fetch(`${API}/api/videos/${id}`, { method: 'DELETE', credentials: 'include' });
  admin.videos = admin.videos.filter(v => v.id !== id);
  renderVideosList();
  toast('Video deleted');
  notifyMainPage();
}

// ═══════════════════════════════════════════════
// ── CONTENT EDITOR ─────────────────────────────
// ═══════════════════════════════════════════════

const contentSchema = {
  home: [
    { key: 'hero_title', label: 'Hero Title' },
    { key: 'hero_subtitle', label: 'Hero Subtitle' },
    { key: 'hero_verse', label: 'Bible Verse', type: 'textarea' },
    { key: 'hero_verse_ref', label: 'Verse Reference' },
    { key: 'hero_cta', label: 'Call to Action Button' },
    { key: 'welcome_title', label: 'Welcome Title' },
    { key: 'welcome_text', label: 'Welcome Text', type: 'textarea' },
    { key: 'services_title', label: 'Services Section Title' },
    { key: 'services_subtitle', label: 'Services Subtitle' },
  ],
  about: [
    { key: 'title', label: 'Page Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'text1', label: 'Paragraph 1', type: 'textarea' },
    { key: 'text2', label: 'Paragraph 2', type: 'textarea' },
    { key: 'text3', label: 'Paragraph 3', type: 'textarea' },
  ],
  children: [
    { key: 'title', label: 'Page Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'text1', label: 'Paragraph 1', type: 'textarea' },
    { key: 'text2', label: 'Paragraph 2', type: 'textarea' },
  ],
  vision: [
    { key: 'title', label: 'Page Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'section1_title', label: 'Section 1 Title' },
    { key: 'section1_text', label: 'Section 1 Text', type: 'textarea' },
    { key: 'section2_title', label: 'Section 2 Title' },
    { key: 'section2_text', label: 'Section 2 Text', type: 'textarea' },
    { key: 'section3_title', label: 'Section 3 Title' },
    { key: 'section3_text', label: 'Section 3 Text', type: 'textarea' },
  ],
  contact: [
    { key: 'title', label: 'Page Title' },
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'address_title', label: 'Address Label' },
    { key: 'address', label: 'Address' },
    { key: 'phone_title', label: 'Phone Label' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'email_title', label: 'Email Label' },
    { key: 'email', label: 'Email Address' },
    { key: 'bank_title', label: 'Bank Label' },
    { key: 'bank_name', label: 'Bank Name' },
    { key: 'bank_detail', label: 'Bank Details' },
    { key: 'bank_iban', label: 'IBAN' },
    { key: 'map_note', label: 'Map Note', type: 'textarea' },
  ],
};

function setupContentPanel() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      admin.activeSection = btn.dataset.section;
      renderContentEditor();
    });
  });
}

function renderContentEditor() {
  const section = admin.activeSection;
  const fields = contentSchema[section] || [];
  const deData = admin.content[section]?.de || {};
  const arData = admin.content[section]?.ar || {};

  const fieldsHtml = fields.map(f => {
    const isTA = f.type === 'textarea';
    const tag = isTA ? 'textarea' : 'input';
    const extra = isTA ? ' rows="3"' : ' type="text"';
    return `<div class="field-group">
      <h4>${f.label}</h4>
      <div class="field-row">
        <div class="field-de">
          <div class="field-label">🇩🇪 Deutsch</div>
          <${tag} class="form-input" data-field="${f.key}" data-lang="de"${extra}>${isTA ? (deData[f.key]||'') : ''}</${tag}>
          ${!isTA ? `<script>document.querySelector('[data-field="${f.key}"][data-lang="de"]').value = ${JSON.stringify(deData[f.key]||'')};</script>` : ''}
        </div>
        <div class="field-ar">
          <div class="field-label">🇸🇦 العربية</div>
          <${tag} class="form-input" data-field="${f.key}" data-lang="ar"${extra} dir="rtl">${isTA ? (arData[f.key]||'') : ''}</${tag}>
          ${!isTA ? `<script>document.querySelector('[data-field="${f.key}"][data-lang="ar"]').value = ${JSON.stringify(arData[f.key]||'')};</script>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('contentEditor').innerHTML = `
    <div class="content-section">
      ${fieldsHtml}
      <div style="margin-top:24px;display:flex;gap:10px">
        <button class="btn btn-primary" id="saveContentBtn">Save Changes</button>
      </div>
    </div>
  `;

  // Apply styles to inputs
  document.querySelectorAll('.form-input').forEach(el => {
    Object.assign(el.style, {
      width: '100%', padding: '9px 12px', border: '1.5px solid #e0ede0',
      borderRadius: '8px', background: '#fafcfa', outline: 'none',
      fontFamily: 'Arial,sans-serif', fontSize: '13px', resize: 'vertical',
    });
  });

  document.getElementById('saveContentBtn')?.addEventListener('click', saveContent);
}

async function saveContent() {
  const section = admin.activeSection;
  const deData = admin.content[section]?.de || {};
  const arData = admin.content[section]?.ar || {};

  document.querySelectorAll('.form-input').forEach(el => {
    const field = el.dataset.field;
    const lang = el.dataset.lang;
    if (lang === 'de') deData[field] = el.value;
    if (lang === 'ar') arData[field] = el.value;
  });

  if (!admin.content[section]) admin.content[section] = {};
  admin.content[section].de = deData;
  admin.content[section].ar = arData;

  const res = await fetch(`${API}/api/content`, {
    method: 'PUT', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin.content)
  }).then(r => r.json()).catch(() => null);

  if (res?.success) {
    toast('Content saved ✓');
    notifyMainPage();
  }
  else toast('Save failed');
}

async function uploadSectionImage(sectionId, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  toast('Uploading image...');
  try {
    const res = await fetch(`${API}/api/uploads/image`, {
      method: 'POST', credentials: 'include', body: formData
    }).then(r => r.json());
    if (res.url) {
      // Update section state
      const page = admin.sectionsPage || 'home';
      const sec = (admin.content[page]?.custom_sections || []).find(s => s.id === sectionId);
      if (sec) sec.url = res.url;
      // Update drop label text
      const drop = document.getElementById(`sec-drop-${sectionId}`);
      if (drop) {
        const label = drop.querySelector('p');
        if (label) label.textContent = '📷 Change image';
        // Show / replace preview image
        const existing = drop.parentElement.querySelector('img');
        if (existing) existing.remove();
        const img = document.createElement('img');
        img.src = res.url;
        img.style.cssText = 'max-height:80px;border-radius:4px;margin-top:6px;display:block';
        drop.insertAdjacentElement('afterend', img);
      }
      toast('Image uploaded ✓');
    } else {
      toast('Upload failed');
    }
  } catch (e) {
    toast('Upload error: ' + e.message);
  }
}

// ── Toast ──────────────────────────────────────
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 3000);
}

// ══════════════════════════════════════════════════════
// ── PAGE BUILDER (Sections Panel) ─────────────────────
// ══════════════════════════════════════════════════════

const SECTION_PAGES = ['home','vision','events','children','media','about','contact'];
let _builderMsgBound = false;

// ── Helpers ────────────────────────────────────────────
function _esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function _attr(str) {
  return String(str||'').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── Main render ────────────────────────────────────────
function renderSectionsPanel() {
  const panelEl = document.getElementById('panel-sections');
  if (!panelEl) return;
  const page = admin.sectionsPage || 'home';
  const sections = admin.content[page]?.custom_sections || [];

  panelEl.innerHTML = `
    <div class="builder-sidebar">
      <div class="builder-sidebar-header">
        <div class="builder-page-label">Page</div>
        <div class="builder-page-tabs">
          ${SECTION_PAGES.map(p =>
            `<button class="tab-btn builder-page-btn${p===page?' active':''}" data-spage="${p}">${p}</button>`
          ).join('')}
        </div>
      </div>
      <div class="builder-add-row">
        <span class="builder-add-label">Quick-add:</span>
        <button class="btn btn-sm btn-outline" onclick="addSectionAt(-1,'text')">＋ Text</button>
        <button class="btn btn-sm btn-outline" onclick="addSectionAt(-1,'image')">＋ Image</button>
        <button class="btn btn-sm btn-outline" onclick="addSectionAt(-1,'video')">＋ Video</button>
      </div>
      <div class="builder-sections-list" id="builderSectionsList">
        ${_renderBuilderList(sections)}
      </div>
      <div class="builder-save-row">
        <button class="btn btn-primary" style="width:100%" onclick="saveSections()">Save Changes</button>
        <button class="btn btn-ghost" style="width:100%;margin-top:6px;font-size:0.78rem;color:var(--muted)" onclick="reloadBuilderFrame()">↺ Refresh Preview</button>
      </div>
    </div>
    <div class="builder-preview">
      <iframe id="builderFrame" src="/" title="Website Preview"></iframe>
    </div>
  `;

  // Page tab buttons
  panelEl.querySelectorAll('.builder-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      collectSectionFields();
      admin.sectionsPage = btn.dataset.spage;
      renderSectionsPanel();
    });
  });

  _setupBuilderFrame();
}

// ── Sections list HTML ─────────────────────────────────
function _renderBuilderList(sections) {
  if (!sections.length) {
    return `<div class="builder-empty">
      <p style="font-weight:600;color:var(--muted)">No sections yet.</p>
      <p style="font-size:0.75rem;margin-top:6px;color:var(--muted)">Use "Quick-add" above or the＋buttons between sections.</p>
    </div>`;
  }
  let html = _renderInsertBtn(0);
  sections.forEach((s, i) => {
    html += _renderSecCard(s, i, sections.length);
    html += _renderInsertBtn(i + 1);
  });
  return html;
}

function _renderInsertBtn(idx) {
  return `<div class="sec-insert-wrap" id="ins-wrap-${idx}">
    <button class="sec-insert-btn" onclick="showInsertTypes(${idx})">＋ insert</button>
    <div class="insert-type-row hidden" id="ins-types-${idx}">
      <button class="btn btn-sm btn-outline" onclick="addSectionAt(${idx},'text')">Text</button>
      <button class="btn btn-sm btn-outline" onclick="addSectionAt(${idx},'image')">Image</button>
      <button class="btn btn-sm btn-outline" onclick="addSectionAt(${idx},'video')">Video</button>
      <button class="btn btn-sm btn-ghost" style="padding:4px 8px" onclick="hideInsertTypes(${idx})">✕</button>
    </div>
  </div>`;
}

function showInsertTypes(idx) {
  document.querySelectorAll('.insert-type-row').forEach(el => el.classList.add('hidden'));
  const row = document.getElementById(`ins-types-${idx}`);
  if (row) row.classList.remove('hidden');
}
function hideInsertTypes(idx) {
  const row = document.getElementById(`ins-types-${idx}`);
  if (row) row.classList.add('hidden');
}

function _secPreview(s) {
  if (s.type === 'text') return s.content_de || s.content_ar || '(empty)';
  if (s.type === 'image') return s.url ? '📷 ' + s.url.split('/').pop() : '(no image)';
  if (s.type === 'video') return s.url ? '🎬 ' + (s.title_de || s.url.split('/').pop()) : '(no video)';
  return '';
}

function _renderSecCard(s, i, total) {
  const isFirst = i === 0;
  const isLast  = i === total - 1;
  const preview = _secPreview(s);
  let bodyHtml  = '';

  if (s.type === 'text') {
    bodyHtml = `
      <div class="sec-field-row">
        <div class="field-de">
          <div class="field-label">🇩🇪 Deutsch</div>
          <textarea class="sec-field" data-sid="${s.id}" data-f="content_de" rows="4">${_esc(s.content_de)}</textarea>
        </div>
        <div class="field-ar">
          <div class="field-label">🇸🇦 العربية</div>
          <textarea class="sec-field" data-sid="${s.id}" data-f="content_ar" rows="4" dir="rtl">${_esc(s.content_ar)}</textarea>
        </div>
      </div>`;

  } else if (s.type === 'image') {
    const imgPrev = s.url
      ? `<img src="${s.url}" style="max-height:80px;border-radius:4px;margin-top:6px;display:block" alt=""/>`
      : '';
    bodyHtml = `
      <div class="form-group" style="margin-bottom:10px">
        <div class="file-drop" style="padding:12px;gap:4px" id="sec-drop-${s.id}"
             onclick="document.getElementById('sec-file-${s.id}').click()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          <p style="font-size:0.78rem">${s.url ? '📷 Change image' : 'Click to upload image'}</p>
          <input type="file" id="sec-file-${s.id}" accept="image/*" hidden
                 onchange="uploadSectionImage('${s.id}', this)"/>
        </div>
        ${imgPrev}
      </div>
      <div class="sec-field-row">
        <div class="field-de">
          <div class="field-label">Caption DE</div>
          <input class="sec-field" data-sid="${s.id}" data-f="caption_de" type="text" value="${_attr(s.caption_de)}"/>
        </div>
        <div class="field-ar">
          <div class="field-label">Caption AR</div>
          <input class="sec-field" data-sid="${s.id}" data-f="caption_ar" type="text" value="${_attr(s.caption_ar)}" dir="rtl"/>
        </div>
      </div>`;

  } else if (s.type === 'video') {
    const vidLabel = s.url
      ? '🎬 Change video (' + s.url.split('/').pop() + ')'
      : 'Click to upload video';
    bodyHtml = `
      <div class="form-group" style="margin-bottom:10px">
        <div class="file-drop" style="padding:12px;gap:4px" id="sec-vid-drop-${s.id}"
             onclick="document.getElementById('sec-vid-file-${s.id}').click()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          <p style="font-size:0.78rem" id="sec-vid-label-${s.id}">${vidLabel}</p>
          <input type="file" id="sec-vid-file-${s.id}" accept="video/*" hidden
                 onchange="uploadSectionVideo('${s.id}', this)"/>
        </div>
      </div>
      <div class="sec-field-row">
        <div class="field-de">
          <div class="field-label">Title DE</div>
          <input class="sec-field" data-sid="${s.id}" data-f="title_de" type="text" value="${_attr(s.title_de)}"/>
        </div>
        <div class="field-ar">
          <div class="field-label">Title AR</div>
          <input class="sec-field" data-sid="${s.id}" data-f="title_ar" type="text" value="${_attr(s.title_ar)}" dir="rtl"/>
        </div>
      </div>`;
  }

  return `<div class="sec-card" id="seccard-${s.id}">
    <div class="sec-card-header" onclick="toggleSecCard('${s.id}')">
      <span class="sec-card-type">${s.type}</span>
      <span class="sec-card-preview">${_esc(preview)}</span>
      <div class="sec-card-actions" onclick="event.stopPropagation()">
        <button class="btn btn-sm btn-ghost sec-move-btn" onclick="moveSec('${s.id}',-1)"
                ${isFirst ? 'disabled' : ''} title="Move up">↑</button>
        <button class="btn btn-sm btn-ghost sec-move-btn" onclick="moveSec('${s.id}',1)"
                ${isLast ? 'disabled' : ''} title="Move down">↓</button>
        <button class="btn btn-sm btn-danger" onclick="deleteSec('${s.id}')" title="Delete">×</button>
      </div>
    </div>
    <div class="sec-card-body hidden" id="secbody-${s.id}">
      ${bodyHtml}
    </div>
  </div>`;
}

// ── Toggle card expand/collapse ────────────────────────
function toggleSecCard(id) {
  const body = document.getElementById(`secbody-${id}`);
  if (!body) return;
  const willOpen = body.classList.contains('hidden');
  body.classList.toggle('hidden', !willOpen);
  // Ping iframe to highlight this section
  const frame = document.getElementById('builderFrame');
  if (frame?.contentWindow && willOpen) {
    frame.contentWindow.postMessage({ type: 'highlight-section', id }, '*');
  }
}

// Called when user clicks a section IN the iframe
function expandSectionCard(id) {
  document.querySelectorAll('.sec-card-body').forEach(b => b.classList.add('hidden'));
  const body = document.getElementById(`secbody-${id}`);
  const card = document.getElementById(`seccard-${id}`);
  if (body) body.classList.remove('hidden');
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── iframe setup ───────────────────────────────────────
function _setupBuilderFrame() {
  const frame = document.getElementById('builderFrame');
  if (!frame) return;

  frame.addEventListener('load', () => {
    const page = admin.sectionsPage || 'home';
    setTimeout(() => {
      frame.contentWindow.postMessage({ type: 'navigate', page }, '*');
      setTimeout(() => {
        frame.contentWindow.postMessage({ type: 'enter-edit-mode' }, '*');
      }, 300);
    }, 150);
  });

  // Bind message listener once (avoid duplicates across re-renders)
  if (!_builderMsgBound) {
    _builderMsgBound = true;
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'section-clicked' && e.data.id) {
        expandSectionCard(e.data.id);
      }
    });
  }
}

function reloadBuilderFrame() {
  const frame = document.getElementById('builderFrame');
  if (!frame) return;
  // Tell frontend to reload data without a full page reload
  if (frame.contentWindow) {
    frame.contentWindow.postMessage({ type: 'reload-data' }, '*');
    setTimeout(() => {
      const page = admin.sectionsPage || 'home';
      frame.contentWindow.postMessage({ type: 'navigate', page }, '*');
      setTimeout(() => frame.contentWindow.postMessage({ type: 'enter-edit-mode' }, '*'), 300);
    }, 800);
  }
}

// ── Section data helpers ───────────────────────────────
function collectSectionFields() {
  document.querySelectorAll('.sec-field').forEach(el => {
    const sid = el.dataset.sid;
    const f   = el.dataset.f;
    if (!sid || !f) return;
    const page = admin.sectionsPage || 'home';
    const sec  = (admin.content[page]?.custom_sections || []).find(s => s.id === sid);
    if (sec) sec[f] = el.value;
  });
}

function addSectionAt(insertIdx, type) {
  collectSectionFields();
  const page = admin.sectionsPage || 'home';
  if (!admin.content[page]) admin.content[page] = {};
  if (!admin.content[page].custom_sections) admin.content[page].custom_sections = [];

  const ns = { id: Date.now().toString(), type };
  if (type === 'text')  { ns.content_de = ''; ns.content_ar = ''; }
  if (type === 'image') { ns.url = ''; ns.caption_de = ''; ns.caption_ar = ''; }
  if (type === 'video') { ns.url = ''; ns.title_de = ''; ns.title_ar = ''; }

  const arr = admin.content[page].custom_sections;
  if (insertIdx < 0 || insertIdx >= arr.length) {
    arr.push(ns);
  } else {
    arr.splice(insertIdx, 0, ns);
  }
  renderSectionsPanel();
  setTimeout(() => expandSectionCard(ns.id), 60);
}

function deleteSec(id) {
  if (!confirm('Delete this section?')) return;
  collectSectionFields();
  const page = admin.sectionsPage || 'home';
  if (admin.content[page]?.custom_sections)
    admin.content[page].custom_sections =
      admin.content[page].custom_sections.filter(s => s.id !== id);
  renderSectionsPanel();
}

function moveSec(id, dir) {
  collectSectionFields();
  const page = admin.sectionsPage || 'home';
  const arr  = admin.content[page]?.custom_sections;
  if (!arr) return;
  const i = arr.findIndex(s => s.id === id);
  const j = i + dir;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]];
  renderSectionsPanel();
}

async function saveSections() {
  collectSectionFields();
  const res = await fetch(`${API}/api/content`, {
    method: 'PUT', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin.content)
  }).then(r => r.json()).catch(() => null);

  if (res?.success) {
    toast('Sections saved ✓');
    notifyMainPage();
    reloadBuilderFrame();
  } else {
    toast('Save failed');
  }
}

// ── Section video upload ───────────────────────────────
async function uploadSectionVideo(sectionId, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);

  const labelEl = document.getElementById(`sec-vid-label-${sectionId}`);
  if (labelEl) labelEl.textContent = 'Uploading…';

  try {
    const res = await fetch(`${API}/api/uploads/video`, {
      method: 'POST', credentials: 'include', body: formData
    }).then(r => r.json());

    if (res.url) {
      const page = admin.sectionsPage || 'home';
      const sec  = (admin.content[page]?.custom_sections || []).find(s => s.id === sectionId);
      if (sec) sec.url = res.url;
      if (labelEl) labelEl.textContent = '🎬 ' + res.url.split('/').pop();
      toast('Video uploaded ✓');
    } else {
      toast('Upload failed: ' + (res.error || 'unknown'));
      if (labelEl) labelEl.textContent = 'Click to upload video';
    }
  } catch (e) {
    toast('Upload error: ' + e.message);
    if (labelEl) labelEl.textContent = 'Click to upload video';
  }
}

// ── Setup all panels on load ──────────────────
document.addEventListener('DOMContentLoaded', () => {
  init().then(() => {
    setupEventsPanel();
    setupContentPanel();
  });
});
