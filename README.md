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

## Generating an Invoice (Excel spreadsheet)

1. Log in as **admin** in the web app
2. Open any booking
3. Click **Create Invoice**
4. Fill in the customer and vehicle details
5. Add line items (Labour, Parts, etc.)
6. Click **Download Excel** — an `.xlsx` file will be saved to your computer

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


