# Al Hayat Kirche — Website

A complete bilingual (German/Arabic) church website with admin panel.

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Start the server

```bash
npm start
```

The site runs at: **http://localhost:3000**

Admin panel at: **http://localhost:3000/admin**

---

## 🔐 Default Admin Login

- **Username:** `admin`
- **Password:** `alhayat2024`

> ⚠️ Change these in `backend/data/users.json` before going live!

---

## 📁 Project Structure

```
alhayat/
├── frontend/
│   ├── index.html          # Main website (all pages)
│   ├── styles.css          # Website styles
│   └── script.js           # Frontend app logic
├── admin/
│   ├── admin.html          # Admin panel
│   ├── admin.css           # Admin styles
│   └── admin.js            # Admin logic
└── backend/
    ├── server.js           # Express server (main)
    ├── package.json
    ├── data/               # JSON file storage
    │   ├── users.json
    │   ├── events.json
    │   ├── gallery.json
    │   ├── videos.json
    │   └── content.json
    └── uploads/            # Uploaded files
        ├── images/
        └── videos/
```

---

## 🌐 Language System

- Switch between **German (DE)** and **Arabic (AR)** via navbar
- German = LTR layout | Arabic = RTL layout  
- Language saved in `localStorage`
- Content is managed per-language in admin panel

---

## ⚙️ Admin Panel Features

| Section | Capabilities |
|---------|-------------|
| **Events** | Add/Edit/Delete events, recurring weekly support |
| **Gallery** | Create albums, upload images (drag & drop), delete |
| **Videos** | Upload video files (with progress bar), delete |
| **Content** | Edit all page text in both DE and AR |

---

## 🌍 Deployment (123 Reg)

### Option A: Node.js Hosting
1. Upload all files
2. Set `npm start` as startup command
3. Set `PORT` environment variable

### Option B: Shared Hosting (PHP)
Not directly supported — use a VPS or Node.js-capable hosting.

### Environment Variables
```bash
PORT=3000
SESSION_SECRET=your-very-secret-key-here
```

---

## 🔒 Security Notes

1. Change admin password in `backend/data/users.json`
2. Set a strong `SESSION_SECRET` environment variable
3. Use HTTPS in production
4. Consider adding rate limiting for login endpoint

---

## 📦 Dependencies

- `express` — Web framework
- `express-session` — Session management  
- `multer` — File upload handling
- `cors` — Cross-origin requests

---

© 2024 Al Hayat Kirche Lünen
