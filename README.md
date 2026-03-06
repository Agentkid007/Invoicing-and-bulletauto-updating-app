# BulletAuto — Invoicing & Service-Booking App

> Vehicle service management system for **Bullet Auto Performance**.  
> Runs as a **web app**, a **Windows desktop app (.exe)**, and a **mobile app (Android & iOS)**.

---

## What's inside

| Folder | What it is |
|--------|-----------|
| `backend/` | Node.js + Express API (port **4000**) |
| `client/` | React web app for customers (port **3000**) |
| `electron/` | Desktop wrapper that loads the web app |
| `admin/` | Standalone Electron admin panel |
| `mobile/` | Expo / React Native mobile app (Android & iOS) |
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
| `npm run desktop:dev` | Alias for `dev:all` — starts backend + client + Electron together. |
| `npm run desktop:build` | Builds the Windows `.exe` installer (same as `electron-build`). |
| `npm run start:all` | Same as `dev:all` but runs the backend in production mode (no auto-restart on file changes). |
| `npm run start-backend` | Starts the backend API server only. |
| `npm run dev-backend` | Starts the backend with **nodemon** (auto-restarts when you save a file). |
| `npm run start-client` | Starts the React web app dev server only. |
| `npm run build:client` | Builds the React web app for production (output goes to `client/dist/`). |
| `npm run electron-build` | Builds a Windows `.exe` installer. Runs `build:client` first automatically. |
| `npm run mobile:start` | Starts the Expo dev server (scan QR with Expo Go app). |
| `npm run android` | Opens the mobile app in an Android emulator or Expo Go on Android. |
| `npm run ios` | Opens the mobile app in an iOS simulator (Mac only). |
| `npm run install:all` | Installs dependencies for root + backend + client + mobile in one command. Run this after a `git pull`. |

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
| Mobile app can't connect to backend | See **"Connecting the mobile app to the backend"** in the Testing & Deployment Guide below |
| `expo: command not found` | Run `npm install -g expo-cli` or use `npx expo start` |

---

## Default login credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@bulletauto.co.za` | `BulletAdmin2024!` |
| **Customer** | Register a new account | — |

> ⚠️ Change the admin password before going live.

---

---

# Testing & Deployment Guide

> A step-by-step guide for testing and distributing BulletAuto across **web, desktop (Windows .exe), Android, and iOS**.

---

## Part 1 — Running the Backend Server

The backend must **always be started first** before any other part of the app.

### Prerequisites

- Node.js LTS installed → https://nodejs.org
- From the project root, run `npm run install:all` once to install all dependencies

### Start the backend

**Option A — From the root folder (recommended):**
```bash
npm run dev-backend
```

**Option B — From inside the backend folder:**
```bash
cd backend
npm run dev
```

✅ You should see:
```
🚗 BulletAuto API v2.0  →  http://localhost:4000
   Admin: admin@bulletauto.co.za / BulletAdmin2024!
```

**Verify the backend is running:**  
Open **http://localhost:4000/api/health** in your browser.  
You should see: `{"status":"ok","service":"BulletAuto API","version":"2.0.0"}`

### Environment variables (optional)

Copy `backend/.env.example` to `backend/.env` to customise settings:
```bash
cd backend
copy .env.example .env     # Windows
# OR
cp .env.example .env       # Mac / Linux
```

---

## Part 2 — Running the Web Client

### Start web + backend together

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

### Start web only (backend already running)

```bash
npm run start-client
```

---

## Part 3 — Desktop App (Windows .exe)

### Development mode

Runs the full app with live reload — backend + React web app + Electron window:

```bash
npm run desktop:dev
```

This starts three processes simultaneously:
1. Backend API on `http://localhost:4000`
2. React web app on `http://localhost:3000`
3. Electron window that loads `http://localhost:3000`

Wait 10–15 seconds for all three to start. An Electron window will open automatically.

### Build the Windows installer (.exe)

> **Requires Windows** (or a Windows CI runner). The build process uses `electron-builder`.

**Step 1 — Install all dependencies (if not done yet):**
```bash
npm run install:all
```

**Step 2 — Build the installer:**
```bash
npm run desktop:build
```

This will:
1. Build the React web app into `client/dist/`
2. Package everything with Electron Builder
3. Output a Windows NSIS installer to `dist-electron/`

**The final file looks like:** `dist-electron/BulletAuto Setup 2.0.0.exe`

**Step 3 — Test the installer:**

1. Open `dist-electron/` in Windows Explorer
2. Double-click `BulletAuto Setup 2.0.0.exe`
3. Follow the installation wizard
4. Launch BulletAuto from your desktop shortcut or Start menu

> **Note:** The installed desktop app needs the backend server running separately.  
> For a fully self-contained desktop app, the backend would need to be bundled inside Electron (advanced setup).

### Adding an app icon

Place your icon files in `electron/assets/`:
- `icon.ico` — Windows icon (256×256, ICO format)
- `icon.icns` — macOS icon
- `icon.png` — Linux / general fallback (512×512 PNG)

---

## Part 4 — Mobile App (Android & iOS with Expo)

The mobile app is in the `mobile/` folder. It is built with **Expo** (React Native).

### Prerequisites

1. **Install Expo CLI globally (optional but recommended):**
   ```bash
   npm install -g expo-cli
   ```

2. **Install mobile dependencies:**
   ```bash
   cd mobile
   npm install
   ```
   Or from the root:
   ```bash
   npm run install:all
   ```

3. **Install the Expo Go app on your phone:**
   - Android: [Play Store — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)

---

### Connecting the mobile app to the backend

> This is the **most important configuration step** for mobile.

The mobile app needs to know the **IP address** of your computer to reach the backend.

**Find your computer's IP address:**

- **Windows:** Open Command Prompt and run:
  ```
  ipconfig
  ```
  Look for `IPv4 Address` under your WiFi adapter, e.g. `192.168.1.50`

- **Mac / Linux:**
  ```bash
  # macOS (use the first en0/en1 address):
  ipconfig getifaddr en0
  # Linux:
  ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v 127.0.0.1
  ```

**Update the API URL in `mobile/src/config/api.js`:**

```javascript
// Change this line:
export const API_BASE_URL = 'http://10.0.2.2:4000/api';

// To your computer's IP address:
export const API_BASE_URL = 'http://192.168.1.50:4000/api';
//                                   ↑ your actual IP
```

> **Important:** Your phone and computer must be on the **same WiFi network**.  
> The backend must be running (`npm run dev-backend`) before you open the mobile app.

**Quick reference for API URLs:**

| Environment | API URL |
|---|---|
| Android emulator (AVD) | `http://10.0.2.2:4000/api` |
| iOS Simulator (Mac) | `http://localhost:4000/api` |
| Physical device (Android or iPhone) | `http://YOUR_PC_IP:4000/api` |

---

### Testing on Android with Expo Go

**Step 1 — Start the backend:**
```bash
npm run dev-backend
```

**Step 2 — Start the Expo dev server:**
```bash
npm run mobile:start
```
Or:
```bash
npm run android
```

**Step 3 — Open on your phone:**
- The terminal shows a **QR code**
- Open the **Expo Go** app on your Android phone
- Tap **"Scan QR Code"** and scan the QR code in the terminal
- The BulletAuto mobile app loads on your phone

**Step 4 — Log in:**
- Email: `admin@bulletauto.co.za`
- Password: `BulletAdmin2024!`

Or register a new customer account on the web app first.

---

### Testing on iOS with Expo Go

> **Note:** iOS Simulator requires a Mac with Xcode installed.  
> Physical iPhone testing with Expo Go does **not** require a Mac.

**Physical iPhone (any OS):**

1. Start the backend and Expo server (same steps as Android above)
2. Open the **Camera** app on your iPhone
3. Scan the QR code shown in the terminal
4. Tap the Expo Go link that appears
5. The app opens in Expo Go

**iOS Simulator (Mac only):**

1. Install Xcode from the Mac App Store
2. Open Xcode → Preferences → Platforms → Install an iOS Simulator
3. Run:
   ```bash
   npm run ios
   ```
4. The simulator opens automatically with the BulletAuto app

---

### Testing on an Android Emulator (AVD)

1. Install **Android Studio** → https://developer.android.com/studio
2. Open Android Studio → Virtual Device Manager → Create a virtual device
3. Start the virtual device
4. Run:
   ```bash
   npm run android
   ```
5. The app installs and launches in the emulator

> When using the Android emulator, the API URL `http://10.0.2.2:4000/api` is already set as the default in `mobile/src/config/api.js` — no change needed.

---

## Part 5 — Building a Production Mobile App (.apk / .ipa)

To generate a standalone `.apk` (Android) or `.ipa` (iOS) file, use **EAS Build** (Expo's cloud build service):

**Step 1 — Install EAS CLI:**
```bash
npm install -g eas-cli
```

**Step 2 — Log in to your Expo account (free):**
```bash
eas login
```

**Step 3 — Configure EAS in the mobile folder:**
```bash
cd mobile
eas build:configure
```

**Step 4 — Build for Android:**
```bash
eas build -p android --profile preview
```

**Step 5 — Build for iOS:**
```bash
eas build -p ios --profile preview
```

EAS will build the app in the cloud and provide a download link. No local Mac or Xcode required for the Android build.

---

## Part 6 — Troubleshooting

| Problem | Solution |
|---|---|
| Mobile app shows "Network request failed" | Check the API URL in `mobile/src/config/api.js` and ensure phone + PC are on the same WiFi |
| Backend not reachable from phone | Temporarily disable Windows Firewall or add a rule to allow port 4000 |
| Expo QR code doesn't work | Make sure your phone is on the same WiFi network as your PC |
| `expo: command not found` | Run `npx expo start` instead of `expo start` |
| Android emulator doesn't start | Open Android Studio → Virtual Device Manager and start the AVD first |
| iOS simulator not found | Install Xcode and at least one iOS Simulator from Xcode preferences |
| `desktop:build` fails with code signing error | Run as Administrator, or add `"forceCodeSigning": false` to `electron-builder` config |
| Electron window is blank | Make sure both backend (port 4000) and client (port 3000) are running |
| Port 4000 or 3000 already in use | `taskkill /F /IM node.exe` (Windows) or `kill $(lsof -t -i:4000)` (Mac/Linux) |
| `npm run install:all` fails on mobile | Run `cd mobile && npm install` manually |

---

## Part 7 — Example Commands for Windows Users

Open **Command Prompt** or **PowerShell** in the project root folder and run:

```bat
REM Install all dependencies (first time only)
npm run install:all

REM Start everything (backend + web + desktop)
npm run desktop:dev

REM Build Windows .exe installer
npm run desktop:build

REM Start mobile dev server (for Expo Go on phone)
npm run mobile:start

REM Start for Android emulator
npm run android

REM Build web app only (for hosting)
npm run build:client
```

> **Tip:** To open a terminal in a specific folder on Windows, hold **Shift** and **right-click** inside the folder, then select "Open PowerShell window here".

---

## Summary Table

| Platform | How to run (development) | How to build (production) |
|---|---|---|
| **Web browser** | `npm run dev` → open http://localhost:3000 | `npm run build:client` → deploy `client/dist/` |
| **Windows desktop** | `npm run desktop:dev` → Electron window opens | `npm run desktop:build` → `dist-electron/*.exe` |
| **Android** | `npm run android` → scan QR in Expo Go | `eas build -p android` → `.apk` download |
| **iOS** | `npm run ios` → scan QR in Expo Go | `eas build -p ios` → `.ipa` download |


