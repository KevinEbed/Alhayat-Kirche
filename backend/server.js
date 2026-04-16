/* ═══════════════════════════════════════════════════════
   Al Hayat Kirche — Backend Server (server.js)
   FIXED: Route ordering, URL-video deletion, error handling
═══════════════════════════════════════════════════════ */
const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'alhayat-church-secret-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ── Static Files ──────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Ensure upload dirs exist ──────────────────────────
const UPLOAD_IMG_DIR = path.join(__dirname, 'uploads/images');
const UPLOAD_VID_DIR = path.join(__dirname, 'uploads/videos');
[UPLOAD_IMG_DIR, UPLOAD_VID_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

// ── JSON Data Helpers ─────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readData(file) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return [];
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); }
  catch { return []; }
}
function readDataObj(file) {
  const fp = path.join(DATA_DIR, file);
  if (!fs.existsSync(fp)) return {};
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')); }
  catch { return {}; }
}
function writeData(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

// ── Multer: Images ────────────────────────────────────
const uploadImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_IMG_DIR),
    filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// ── Multer: Videos ────────────────────────────────────
const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_VID_DIR),
    filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files allowed'));
  }
});

// ── Auth Middleware ───────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ── Generic single-image upload (for sections builder) ─
app.post('/api/uploads/image', requireAuth, uploadImage.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: '/uploads/images/' + req.file.filename });
});

// ── Generic single-video upload (for sections builder) ─
app.post('/api/uploads/video', requireAuth, uploadVideo.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: '/uploads/videos/' + req.file.filename });
});

// ─────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const users = readData('users.json');
  const user  = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.admin = { username: user.username };
    res.json({ success: true, username: user.username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  if (req.session && req.session.admin)
    res.json({ loggedIn: true, username: req.session.admin.username });
  else
    res.json({ loggedIn: false });
});

// ─────────────────────────────────────────────────────
// CONTENT ROUTES
// ─────────────────────────────────────────────────────
app.get('/api/content', (req, res) => {
  res.json(readDataObj('content.json'));
});

app.put('/api/content', requireAuth, (req, res) => {
  writeData('content.json', req.body);
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────
// EVENTS ROUTES
// ─────────────────────────────────────────────────────
app.get('/api/events', (req, res) => {
  res.json(readData('events.json'));
});

app.post('/api/events', requireAuth, (req, res) => {
  const events   = readData('events.json');
  const newEvent = { ...req.body, id: Date.now().toString() };
  events.push(newEvent);
  writeData('events.json', events);
  res.json(newEvent);
});

app.put('/api/events/:id', requireAuth, (req, res) => {
  let events = readData('events.json');
  events = events.map(e => e.id === req.params.id ? { ...req.body, id: req.params.id } : e);
  writeData('events.json', events);
  res.json({ success: true });
});

app.delete('/api/events/:id', requireAuth, (req, res) => {
  let events = readData('events.json');
  events = events.filter(e => e.id !== req.params.id);
  writeData('events.json', events);
  res.json({ success: true });
});

// Upload poster image for a special event — saves file + patches imageUrl into the event record
app.post('/api/events/:id/image', requireAuth, uploadImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const imageUrl = '/uploads/images/' + req.file.filename;
  let events = readData('events.json');
  events = events.map(e => e.id === req.params.id ? { ...e, imageUrl } : e);
  writeData('events.json', events);
  res.json({ imageUrl });
});

// ─────────────────────────────────────────────────────
// GALLERY ROUTES
// ─────────────────────────────────────────────────────
app.get('/api/gallery', (req, res) => {
  res.json(readData('gallery.json'));
});

// Also expose flat /api/albums endpoint (spec requirement)
app.get('/api/albums', (req, res) => {
  res.json(readData('gallery.json'));
});

app.post('/api/gallery/albums', requireAuth, (req, res) => {
  const gallery  = readData('gallery.json');
  const newAlbum = { ...req.body, id: Date.now().toString(), images: [] };
  gallery.push(newAlbum);
  writeData('gallery.json', gallery);
  res.json(newAlbum);
});

// Also /api/albums (spec requirement)
app.post('/api/albums', requireAuth, (req, res) => {
  const gallery  = readData('gallery.json');
  const newAlbum = { ...req.body, id: Date.now().toString(), images: [] };
  gallery.push(newAlbum);
  writeData('gallery.json', gallery);
  res.json(newAlbum);
});

app.put('/api/gallery/albums/:id', requireAuth, (req, res) => {
  let gallery = readData('gallery.json');
  gallery = gallery.map(a => a.id === req.params.id ? { ...a, ...req.body } : a);
  writeData('gallery.json', gallery);
  res.json({ success: true });
});

app.delete('/api/gallery/albums/:id', requireAuth, (req, res) => {
  let gallery = readData('gallery.json');
  const album = gallery.find(a => a.id === req.params.id);
  if (album && Array.isArray(album.images)) {
    album.images.forEach(img => {
      if (img.url && img.url.startsWith('/uploads/')) {
        const fp = path.join(__dirname, img.url);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    });
  }
  gallery = gallery.filter(a => a.id !== req.params.id);
  writeData('gallery.json', gallery);
  res.json({ success: true });
});

// Also /api/albums/:id DELETE (spec requirement)
app.delete('/api/albums/:id', requireAuth, (req, res) => {
  let gallery = readData('gallery.json');
  const album = gallery.find(a => a.id === req.params.id);
  if (album && Array.isArray(album.images)) {
    album.images.forEach(img => {
      if (img.url && img.url.startsWith('/uploads/')) {
        const fp = path.join(__dirname, img.url);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    });
  }
  gallery = gallery.filter(a => a.id !== req.params.id);
  writeData('gallery.json', gallery);
  res.json({ success: true });
});

// Upload images into an album
app.post('/api/gallery/albums/:id/images', requireAuth, uploadImage.array('images', 50), (req, res) => {
  let gallery = readData('gallery.json');
  const album = gallery.find(a => a.id === req.params.id);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded' });
  const newImages = req.files.map(f => ({
    id:       Date.now().toString() + '-' + Math.random().toString(36).slice(2),
    url:      '/uploads/images/' + f.filename,
    filename: f.filename
  }));
  album.images.push(...newImages);
  writeData('gallery.json', gallery);
  res.json(newImages);
});

// Also /api/images (spec requirement) — upload to specific album via query ?albumId=
app.post('/api/images', requireAuth, uploadImage.array('images', 50), (req, res) => {
  const albumId = req.body.albumId || req.query.albumId;
  if (!albumId) return res.status(400).json({ error: 'albumId required' });
  let gallery = readData('gallery.json');
  const album = gallery.find(a => a.id === albumId);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  const newImages = (req.files || []).map(f => ({
    id:       Date.now().toString() + '-' + Math.random().toString(36).slice(2),
    url:      '/uploads/images/' + f.filename,
    filename: f.filename
  }));
  album.images.push(...newImages);
  writeData('gallery.json', gallery);
  res.json(newImages);
});

// Get images for a specific album
app.get('/api/images/:albumId', (req, res) => {
  const gallery = readData('gallery.json');
  const album   = gallery.find(a => a.id === req.params.albumId);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  res.json(album.images || []);
});

app.delete('/api/gallery/albums/:albumId/images/:imageId', requireAuth, (req, res) => {
  let gallery = readData('gallery.json');
  const album = gallery.find(a => a.id === req.params.albumId);
  if (!album) return res.status(404).json({ error: 'Album not found' });
  const img = album.images.find(i => i.id === req.params.imageId);
  if (img && img.url && img.url.startsWith('/uploads/')) {
    const fp = path.join(__dirname, img.url);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  album.images = album.images.filter(i => i.id !== req.params.imageId);
  writeData('gallery.json', gallery);
  res.json({ success: true });
});

// Also /api/images/:id DELETE (spec requirement — deletes by image id across all albums)
app.delete('/api/images/:id', requireAuth, (req, res) => {
  let gallery = readData('gallery.json');
  let found = false;
  gallery.forEach(album => {
    const img = album.images.find(i => i.id === req.params.id);
    if (img) {
      found = true;
      if (img.url && img.url.startsWith('/uploads/')) {
        const fp = path.join(__dirname, img.url);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
      album.images = album.images.filter(i => i.id !== req.params.id);
    }
  });
  writeData('gallery.json', gallery);
  res.json({ success: true, found });
});

// ─────────────────────────────────────────────────────
// VIDEO ROUTES
// IMPORTANT: /api/videos/url must come BEFORE /api/videos POST
// because Express matches routes in order, and the POST /api/videos
// uses multer middleware that would error on non-file requests.
// ─────────────────────────────────────────────────────
app.get('/api/videos', (req, res) => {
  res.json(readData('videos.json'));
});

// ── Add video by URL (YouTube, Vimeo, direct link) ──
// MUST be before the multer upload route
app.post('/api/videos/url', requireAuth, (req, res) => {
  const videos = readData('videos.json');
  const { url, title_de, title_ar, description_de, description_ar } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  const newVideo = {
    id:             Date.now().toString(),
    title_de:       title_de || 'Video',
    title_ar:       title_ar || '',
    description_de: description_de || '',
    description_ar: description_ar || '',
    url,
    isUrl:          true,
    date:           new Date().toISOString(),
  };
  videos.push(newVideo);
  writeData('videos.json', videos);
  res.json(newVideo);
});

// ── Upload video file ────────────────────────────────
app.post('/api/videos', requireAuth, (req, res, next) => {
  // Use multer then handle manually so we can return proper JSON errors
  uploadVideo.single('video')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No video file uploaded' });
    const videos = readData('videos.json');
    const newVideo = {
      id:             Date.now().toString(),
      title_de:       req.body.title_de || 'Video',
      title_ar:       req.body.title_ar || '',
      description_de: req.body.description_de || '',
      description_ar: req.body.description_ar || '',
      url:            '/uploads/videos/' + req.file.filename,
      filename:       req.file.filename,
      isUrl:          false,
      date:           new Date().toISOString(),
    };
    videos.push(newVideo);
    writeData('videos.json', videos);
    res.json(newVideo);
  });
});

app.put('/api/videos/:id', requireAuth, (req, res) => {
  let videos = readData('videos.json');
  const idx = videos.findIndex(v => v.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Video not found' });
  videos[idx] = { ...videos[idx], ...req.body, id: req.params.id };
  writeData('videos.json', videos);
  res.json({ success: true });
});

app.delete('/api/videos/:id', requireAuth, (req, res) => {
  let videos = readData('videos.json');
  const video = videos.find(v => v.id === req.params.id);
  // Only try to delete the file if it's an uploaded file (not a URL)
  if (video && !video.isUrl && video.url && video.url.startsWith('/uploads/')) {
    const fp = path.join(__dirname, video.url);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  videos = videos.filter(v => v.id !== req.params.id);
  writeData('videos.json', videos);
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────
// CATCH-ALL → serve frontend / admin
// ─────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/admin')) {
    res.sendFile(path.join(__dirname, '../admin/admin.html'));
  } else {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// ── Error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log(`✅ Al Hayat Kirche running at http://localhost:${PORT}`);
  console.log(`   Admin panel:  http://localhost:${PORT}/admin`);
  console.log(`   Login:        admin / alhayat2024`);
});
