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
