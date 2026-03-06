# BulletAuto — Invoicing & Service-Booking App

> Vehicle service management system for **Bullet Auto Performance**.  
> Runs as a web app, a customer mobile PWA, and a Windows desktop app.

---

## What's inside

| Folder | What it is |
|--------|-----------|
| `backend/` | Node.js + Express API (port **4000**) |
| `client/` | React web app for customers (port **3000**) |
| `electron/` | Desktop wrapper that loads the web app |
| `admin/` | Standalone Electron admin panel |
| `shared/` | Shared utilities used by web + mobile |

---

## Before you start — install these once

1. **Download and install Node.js** → https://nodejs.org  
   *(pick the LTS version — it includes npm automatically)*
2. **Download and install Git** → https://git-scm.com

To check everything is installed, open a terminal and run:
```
node -v
npm -v
```
Both commands should print a version number. If they do, you are ready.

---

## Step 1 — Get the project onto your computer

Open a terminal (Command Prompt or PowerShell on Windows) and run:

```bash
git clone https://github.com/Agentkid007/Invoicing-and-bulletauto-updating-app.git
cd Invoicing-and-bulletauto-updating-app
```

---

## Updating to the latest version (already cloned the project?)

If you cloned the project before and want the newest code, do this instead of Step 1:

**1. Open a terminal inside the project folder and pull the latest changes:**
```bash
git pull origin main
```

> If you see a merge conflict, run `git status` to see which files are affected, then open each conflicted file and resolve the markers (`<<<<<<`, `======`, `>>>>>>`), or ask for help.

**2. Check for new dependencies** (run this if `package.json` files were updated):
```bash
npm run install:all
```

This reinstalls packages for the root, backend, and client in one shot.

**3. Restart the app:**
```bash
npm run dev:all
```

That's it — you're running the latest version. ✅

---

## Step 2 — Install dependencies (do this once)

Run these commands **one at a time**, in order:

```bash
# Install root scripts
npm install

# Install backend packages
cd backend
npm install
cd ..

# Install web app packages
cd client
npm install
cd ..
```

---

## Step 3 — Run everything at once (easiest way)

From the **root folder** of the project, run:

```bash
npm run dev:all
```

This single command starts **all three apps at the same time**:

| What started | Where to open it |
|---|---|
| Backend API | Runs silently — powers everything |
| Customer web app | Open **http://localhost:3000** in your browser |
| Desktop admin app | An Electron window opens automatically |

> **Wait about 5–10 seconds** after running the command for everything to start up.

---

## Step 4 — Log in

### As an Admin (full access)

| Field | Value |
|---|---|
| Email | `admin@bulletauto.co.za` |
| Password | `BulletAdmin2024!` |

Use these credentials in both the **web app** and the **desktop app**.

### As a Customer

Click **Register** on the login screen and create a new account.

---

## Running apps individually (if you prefer separate terminals)

If you want to start each app in its own terminal window:

**Terminal 1 — Backend (start this first)**
```bash
cd backend
npm run dev
```
✅ You should see: `🚗 BulletAuto API v2.0 → http://localhost:4000`

**Terminal 2 — Customer Web App**
```bash
cd client
npm run dev
```
✅ Open **http://localhost:3000** in your browser.

**Terminal 3 — Desktop Admin App**
```bash
cd admin
npm start
```
✅ An Electron window opens with the admin dashboard.

> **Important:** Always start the **backend first** before the other apps.

---

## What each app does

### 🌐 Customer Web App (`http://localhost:3000`)
- Register or log in as a customer
- Submit a vehicle service booking
- Track your booking status in real time
- Chat with the mechanic (notes + photo/video uploads)

### 🖥️ Desktop Admin App (Electron window)
- Log in as admin
- See all customer bookings
- Update booking status and progress
- Add mechanic notes with media
- **Scan a license disk** with your webcam to auto-fill vehicle details

### ⚙️ Backend API (`http://localhost:4000`)
- Runs silently — the web and desktop apps talk to it automatically
- Check it is running: open **http://localhost:4000/api/health** in your browser
  - You should see: `{"status":"ok","service":"BulletAuto API"}`

---

## Scripts Reference

All scripts are run from the **root folder** of the project.

| Script | What it does |
|---|---|
| `npm run dev` | Starts **backend + client web app** only (no Electron). Use this if you just want the web app in a browser. |
| `npm run dev:all` | Starts **backend + client + Electron admin desktop app** simultaneously. Best for full development. |
| `npm run start:all` | Same as `dev:all` but runs the backend in production mode (no auto-restart on file changes). |
| `npm run start-backend` | Starts the backend API server only. |
| `npm run dev-backend` | Starts the backend with **nodemon** (auto-restarts when you save a file). |
| `npm run start-client` | Starts the React web app dev server only. |
| `npm run build:client` | Builds the React web app for production (output goes to `client/dist/`). |
| `npm run electron-build` | Builds a Windows `.exe` installer. Runs `build:client` first automatically. |
| `npm run install:all` | Installs dependencies for root + backend + client in one command. Run this after a `git pull`. |

> **Windows note:** All scripts use `npm --prefix <folder>` instead of `cd <folder> &&` so they work in both Command Prompt **and** PowerShell.

---

## Generating an Invoice (Excel spreadsheet)

Invoices are managed inside the **Desktop Admin App** (Electron window).

**Option A — From a service job (fastest):**

1. Open the **Desktop Admin App** and log in as admin
2. Go to **Service Jobs**
3. Find the job and click the **invoice icon** (📄) in the Actions column
4. The form pre-fills with the customer's name, phone, email, and vehicle details
5. Add line items (Labour, Parts, etc.) — totals calculate automatically
6. Click **Save Invoice**, then **Download Excel**

**Option B — From the Invoices section:**

1. Open the **Desktop Admin App** and log in as admin
2. Click **Invoices** in the left sidebar
3. Click **New Invoice** and fill in all fields
4. Add line items — VAT (15%) is calculated automatically
5. Click **Save Invoice**
6. Click **Download Excel** — an `.xlsx` file is saved to your computer

The spreadsheet matches the official **Bullet Auto Performance Cost Estimate** template with:
- Company logo area and address
- Yellow input cells for customer/vehicle details
- Itemised parts and labour table
- VAT (15%) calculated automatically
- Banking details and totals

---

## Scanning a License Disk

1. Log in as **admin**
2. On the dashboard, click **📷 Scan License Disk**
3. Allow camera access when the browser asks
4. Hold the license disk's **QR code or barcode** up to the camera
5. The app reads it automatically and fills in the vehicle details
6. Click **✓ Use This Data** to pre-fill the booking form

---

## Stopping the apps

- **If you used `npm run dev:all`** — press `Ctrl + C` in the terminal
- **If you used separate terminals** — press `Ctrl + C` in each terminal window
- **Desktop app** — close the Electron window normally

---

## Common problems

| Problem | Fix |
|---|---|
| `command not found: node` | Install Node.js from https://nodejs.org |
| `npm install` fails | Delete the `node_modules` folder and run `npm install` again |
| Web app shows a blank page | Make sure the backend is running first |
| Desktop app shows a white screen | Start the backend (`cd backend && npm run dev`), then restart the desktop app |
| Port 4000 already in use | Close other apps using that port, or change `PORT=4001` in `backend/.env` |
| Camera not working for scanner | Click "Allow" when the browser asks for camera permission |

---

## Default login credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@bulletauto.co.za` | `BulletAdmin2024!` |
| **Customer** | Register a new account | — |

> ⚠️ Change the admin password before going live.


