# BulletAuto — Invoicing & Service-Booking App

A three-part vehicle service management system:

| App | Technology | Purpose |
|-----|-----------|---------|
| **backend** | Node.js / Express | REST API + real-time SSE updates |
| **client** | React / Vite (PWA) | Customer-facing mobile web app |
| **admin** | Electron | Desktop admin dashboard |

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project structure](#project-structure)
3. [Installation](#installation)
4. [Running the apps](#running-the-apps)
   - [1 · Backend API](#1--backend-api)
   - [2 · Client web app](#2--client-web-app)
   - [3 · Admin desktop app](#3--admin-desktop-app)
5. [Default credentials](#default-credentials)
6. [API reference (quick-test)](#api-reference-quick-test)
7. [End-to-end testing walkthrough](#end-to-end-testing-walkthrough)
8. [Testing tools — what to use for each app](#testing-tools--what-to-use-for-each-app)
   - [Backend API](#backend-api-testing-tools)
   - [Client web app](#client-web-app-testing-tools)
   - [Admin desktop app](#admin-desktop-app-testing-tools)
   - [Real-time SSE updates](#real-time-sse-updates)
9. [Publishing & deployment](#publishing--deployment)
   - [Backend](#backend--deploy-to-a-server)
   - [Client web app](#client-web-app--deploy-to-a-static-host)
   - [Admin desktop app](#admin-desktop-app--package-as-an-installer)

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| [Node.js](https://nodejs.org/) | 18 LTS | 20 LTS recommended |
| npm | comes with Node | |
| Git | any recent | to clone |
| A desktop OS | Windows / macOS / Linux | required for the Electron admin app |

---

## Project structure

```
.
├── backend/          # Express REST API
│   ├── server.js     # Entry point (port 4000)
│   ├── db.js         # lowdb JSON database helpers
│   └── bulletauto.db.json  # auto-created flat-file database
│
├── client/           # React / Vite PWA (customer app)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api.js    # points to http://localhost:4000/api
│   │   └── pages/    # Login, Register, Dashboard, NewBooking, BookingDetail
│   └── vite.config.js
│
└── admin/            # Electron desktop app (admin dashboard)
    ├── main.js       # Electron entry point
    └── src/
        └── index.html
```

---

## Installation

Open a terminal and install dependencies for each of the three apps:

```bash
# 1. Backend
cd backend
npm install

# 2. Client
cd ../client
npm install

# 3. Admin
cd ../admin
npm install
```

---

## Running the apps

All three apps need to be running at the same time for the full system to work.
Open **three separate terminal windows/tabs**.

### 1 · Backend API

```bash
cd backend

# Production mode
npm start          # runs: node server.js

# Development mode (auto-restarts on file changes)
npm run dev        # runs: nodemon server.js
```

The API starts on **http://localhost:4000**.
A health-check URL is available at http://localhost:4000/api/health.

> **First run:** The database file `bulletauto.db.json` is created automatically
> and the default admin account is seeded (see [Default credentials](#default-credentials)).

---

### 2 · Client web app

```bash
cd client
npm run dev        # Vite dev server on http://localhost:3000
```

Open **http://localhost:3000** in your browser (or a mobile browser on the same network).

To build a production bundle:

```bash
npm run build      # output → client/dist/
npm run preview    # preview the production build locally
```

---

### 3 · Admin desktop app

```bash
cd admin
npm start          # runs: electron .
```

An Electron window opens showing the admin dashboard.
The admin app connects to the backend at `http://localhost:4000` — **start the backend first**.

---

## Default credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@bulletauto.co.za` | `BulletAdmin2024!` |
| Client | *(register a new account)* | — |

Use the admin credentials in both the **client web app** (to access admin-only views)
and the **admin desktop app**.

> **⚠️ Security note:** The default admin password is seeded automatically on first run.
> Change it immediately in any non-local/production environment by updating the
> `password_hash` in `backend/bulletauto.db.json` (generate a new bcrypt hash) or
> by adding a change-password API endpoint before deploying.

---

## API reference (quick-test)

All routes are prefixed with `http://localhost:4000/api`.

### Health

```
GET /api/health
```

### Auth

```
POST /api/auth/register   body: { name, email, phone?, password }
POST /api/auth/login      body: { email, password }  → returns { token, user }
GET  /api/auth/me         header: Authorization: Bearer <token>
```

### Bookings

```
GET    /api/bookings           # client sees own bookings; admin sees all
POST   /api/bookings           body: { car_make, car_model, car_year, car_registration, service_type, description?, drop_off_date? }
GET    /api/bookings/:id
PATCH  /api/bookings/:id       (admin only) body: { status?, progress?, estimated_completion?, mechanic_notes?, update_message? }
DELETE /api/bookings/:id       (admin only)
```

### Notes / messaging

```
GET  /api/bookings/:id/notes
POST /api/bookings/:id/notes   body: form-data { message?, media? (up to 10 files) }
```

### Admin-only

```
GET /api/clients
GET /api/stats
GET /api/service-types
```

### cURL examples

```bash
# Health check
curl http://localhost:4000/api/health

# Login as admin
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bulletauto.co.za","password":"BulletAdmin2024!"}' | jq .

# Store the token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bulletauto.co.za","password":"BulletAdmin2024!"}' | jq -r .token)

# List all bookings (as admin)
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/bookings

# Get stats
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/stats
```

---

## End-to-end testing walkthrough

### Step 1 — Start the backend
```bash
cd backend && npm run dev
```
Verify: `curl http://localhost:4000/api/health` returns `{"status":"ok",...}`.

### Step 2 — Start the client app
```bash
cd client && npm run dev
```
Open **http://localhost:3000** in your browser.

### Step 3 — Register a test customer
1. Click **Register** on the login screen.
2. Fill in name, email, phone, and password, then submit.
3. You are logged in and redirected to the customer dashboard.

### Step 4 — Create a service booking
1. Tap **New Booking**.
2. Fill in car details (make, model, year, registration) and choose a service type.
3. Submit — the booking now appears in the dashboard with status **Pending**.

### Step 5 — Process the booking as admin (desktop app)
```bash
cd admin && npm start
```
1. Log in with the admin credentials.
2. Find the booking created in Step 4.
3. Change the status (e.g. to **In Progress**) and set a progress percentage.
4. Add a mechanic note/message.

### Step 6 — Observe real-time updates
Switch back to the browser tab (Step 3) — the booking status and progress update
**automatically** via Server-Sent Events without refreshing the page.

### Step 7 — Test media uploads (optional)
From either the client or admin notes section, attach an image or video file
(jpg/png/gif/webp/mp4/mov/webm, max 50 MB per file, 10 files per message).
The file is served from `http://localhost:4000/uploads/<filename>`.

---

## Testing tools — what to use for each app

### Backend API testing tools

These tools let you call every API endpoint directly without opening the web or desktop app.

| Tool | Platform | Free? | Best for |
|------|----------|-------|---------|
| **[Postman](https://www.postman.com/downloads/)** | Windows / macOS / Linux | ✅ | Full API testing with saved collections, environments, and automated test scripts |
| **[Insomnia](https://insomnia.rest/download)** | Windows / macOS / Linux | ✅ | Lightweight REST + GraphQL client, clean UI |
| **[Hoppscotch](https://hoppscotch.io/)** | Browser (web app) | ✅ | Quick in-browser testing, no install needed |
| **REST Client** (VS Code extension) | VS Code | ✅ | Write `.http` files alongside your code |
| **cURL** | Any terminal | ✅ | Scriptable, great for CI or quick checks |
| **Thunder Client** (VS Code extension) | VS Code | ✅ | Postman-like UI inside VS Code |

#### Recommended: Postman quick-start

1. Download and open [Postman](https://www.postman.com/downloads/).
2. Create a new **Collection** called `BulletAuto`.
3. Set a **Collection Variable** `baseUrl = http://localhost:4000/api`.
4. Add a request: `POST {{baseUrl}}/auth/login`, body → raw JSON:
   ```json
   { "email": "admin@bulletauto.co.za", "password": "BulletAdmin2024!" }
   ```
5. In the **Tests** tab of that request, save the token automatically:
   ```js
   const { token } = pm.response.json();
   pm.collectionVariables.set("token", token);
   ```
6. For all authenticated requests, set the **Auth** tab to `Bearer Token` → `{{token}}`.
7. You can now test every route listed in the [API reference](#api-reference-quick-test) interactively.

#### VS Code REST Client example

Create a file `api-tests.http` at the project root:

```http
### Health check
GET http://localhost:4000/api/health

### Admin login
# @name login
POST http://localhost:4000/api/auth/login
Content-Type: application/json

{
  "email": "admin@bulletauto.co.za",
  "password": "BulletAdmin2024!"
}

### Use the token from the login response
@token = {{login.response.body.token}}

### List all bookings
GET http://localhost:4000/api/bookings
Authorization: Bearer {{token}}

### Get stats
GET http://localhost:4000/api/stats
Authorization: Bearer {{token}}
```

Click the **Send Request** link above each block to run it.

---

### Client web app testing tools

| Tool | How to open | What to test |
|------|-------------|--------------|
| **Chrome DevTools** | F12 or right-click → Inspect | Network tab: watch API calls and SSE stream; Console: catch JS errors; Application tab: inspect localStorage token |
| **Firefox DevTools** | F12 | Same as Chrome; particularly good SSE viewer under Network → EventStream |
| **Responsive design mode** | Chrome: Ctrl+Shift+M / Firefox: Ctrl+Shift+M | Simulate iPhone/Android screen sizes — the client is mobile-first |
| **Chrome Lighthouse** | DevTools → Lighthouse tab | Run a PWA audit to confirm the app is installable and scores well |
| **Android / iOS browser** | Open `http://<your-LAN-IP>:3000` on your phone | Real device testing while Vite dev server is running |

#### Testing the PWA install flow

1. Open `http://localhost:3000` in Chrome.
2. Open DevTools → **Application** → **Manifest** — verify the manifest loads.
3. Click the **install** icon in Chrome's address bar (or DevTools → Application → **Install**).
4. The app opens as a standalone window — bookings and login work identically to the browser tab.

#### Simulating a mobile device in Chrome

1. Open `http://localhost:3000`.
2. Press **F12** → click the **Toggle device toolbar** icon (or Ctrl+Shift+M).
3. Choose a device preset (e.g. iPhone 14, Pixel 7) from the dropdown.
4. The entire client UI re-renders at that viewport — test all pages.

---

### Admin desktop app testing tools

| Tool | How to open | What to test |
|------|-------------|--------------|
| **Electron DevTools** | In the running admin window press **F12** (or Ctrl+Shift+I on Windows/Linux, Cmd+Option+I on macOS) | Console errors, network requests, localStorage |
| **Electron DevTools — Network tab** | Same as above | Confirm API calls reach `http://localhost:4000` and return 200 |

> If the app opens but shows a blank white page, open DevTools and check the **Console**
> for errors — it usually means the backend is not running.

---

### Real-time SSE updates

Server-Sent Events (SSE) push live booking changes from the backend to all connected clients.
You can watch the raw SSE stream in two ways:

**Browser (built-in)**

Open a new browser tab and navigate to:
```
http://localhost:4000/api/events
```
The page displays a continuous text stream. Each time a booking is created, updated,
or deleted you will see a new `event:` line appear in real time.

**cURL**

```bash
curl -N http://localhost:4000/api/events
```

The `-N` flag disables buffering so you see each event as it arrives.
Make a booking change in another terminal or in the app and watch the event appear here.

---

## Publishing & deployment

### Backend — deploy to a server

The backend is a standard Node.js/Express app. Pick any platform:

#### Option A — [Render](https://render.com/) (recommended, free tier available)

1. Push your code to GitHub (already done).
2. Sign in to Render → **New → Web Service**.
3. Connect your GitHub repo and select the `backend` folder as the **Root Directory**.
4. Set:
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
5. Add environment variables in the Render dashboard:
   ```
   JWT_SECRET=<a long random string — do NOT reuse the default>
   PORT=10000
   ```
6. Click **Deploy**. Render gives you a public URL like `https://bulletauto-api.onrender.com`.

#### Option B — [Railway](https://railway.app/)

1. Sign in → **New Project → Deploy from GitHub repo**.
2. Select your repo and set the **root directory** to `backend`.
3. Railway auto-detects Node and runs `npm start`.
4. Set the `JWT_SECRET` environment variable in the Variables panel.

#### Option C — VPS / any Linux server

```bash
# On the server
git clone <your-repo-url>
cd backend && npm install

# Run with pm2 so it restarts on crashes
npm install -g pm2
pm2 start server.js --name bulletauto-api
pm2 save && pm2 startup
```

> After deploying the backend, update `client/src/api.js` — change the `BASE` URL
> from `http://localhost:4000/api` to your live backend URL before building the client.

---

### Client web app — deploy to a static host

The client is a Vite/React SPA. Build it first:

```bash
cd client
# Point to your deployed backend URL
# Edit src/api.js: const BASE = 'https://your-backend-url.com/api';
npm run build    # output → client/dist/
```

Then deploy the `dist/` folder to one of these hosts:

#### [Vercel](https://vercel.com/) (recommended, free tier)

```bash
npm install -g vercel
cd client
vercel         # follow the prompts — it auto-detects Vite
```

Or connect via Vercel's web UI:
1. Import your GitHub repo → set **Root Directory** to `client`.
2. Framework preset: **Vite**.
3. Build command: `npm run build` / Output directory: `dist`.
4. Add environment variable if needed, then **Deploy**.

#### [Netlify](https://netlify.com/) (free tier)

```bash
npm install -g netlify-cli
cd client && npm run build
netlify deploy --prod --dir=dist
```

Or drag-and-drop the `client/dist/` folder onto [app.netlify.com/drop](https://app.netlify.com/drop).

> **SPA routing:** Add a `client/public/_redirects` file with the single line
> `/* /index.html 200` so that deep links like `/bookings/abc` work on Netlify.
> Vercel handles this automatically.

#### Installing as a PWA on mobile

Once the client is deployed to a public HTTPS URL:

- **Android (Chrome):** open the site → three-dot menu → **Add to Home screen**.
- **iOS (Safari):** open the site → Share button → **Add to Home Screen**.

The app icon appears on the home screen and opens in full-screen mode like a native app.

---

### Admin desktop app — package as an installer

Use **[electron-builder](https://www.electron.build/)** to create distributable installers.

#### 1. Install electron-builder

```bash
cd admin
npm install --save-dev electron-builder
```

#### 2. Add build config to `admin/package.json`

```json
{
  "build": {
    "appId": "co.bulletauto.admin",
    "productName": "BulletAuto Admin",
    "directories": { "output": "dist" },
    "win": {
      "target": "nsis",
      "icon": "src/assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "src/assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "src/assets/icon.png"
    }
  },
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "dist": "electron-builder"
  }
}
```

#### 3. Build the installer

```bash
# Windows installer (.exe)  — run on Windows or use a CI runner
npm run dist -- --win

# macOS disk image (.dmg)  — must be run on macOS
npm run dist -- --mac

# Linux AppImage            — run on Linux
npm run dist -- --linux
```

The packaged installer is saved to `admin/dist/`.

#### Publishing Electron releases via GitHub Actions (CI)

Add `.github/workflows/release-admin.yml` to automatically build and attach installers
to a GitHub Release whenever you push a version tag:

```yaml
name: Build & Release Admin App
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install
        working-directory: admin
      - run: npm run dist
        working-directory: admin
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: admin-${{ matrix.os }}
          path: admin/dist/
```

