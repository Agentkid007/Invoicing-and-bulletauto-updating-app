'use strict';
/**
 * electron/main.js
 * BulletAuto Desktop App — Electron main process.
 *
 * Loads the Vite/React frontend (dev: http://localhost:3000, prod: client/dist/index.html)
 * and connects to the Express backend API (http://localhost:4000).
 * Includes electron-updater for automatic Windows updates via GitHub Releases.
 */

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  Menu,
} = require('electron');
const path       = require('path');
const { autoUpdater } = require('electron-updater');

// ─── Environment ──────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === 'development' ||
              process.argv.includes('--dev') ||
              !app.isPackaged;

const CLIENT_URL   = 'http://localhost:3000';
const CLIENT_DIST  = path.join(__dirname, '..', 'client', 'dist', 'index.html');

// ─── Auto-updater configuration ───────────────────────────────────────────────
autoUpdater.autoDownload       = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow  = null;
let splashWindow = null;

// ─── Splash screen ────────────────────────────────────────────────────────────
function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width:           440,
    height:          380,
    frame:           false,
    transparent:     true,
    resizable:       false,
    alwaysOnTop:     true,
    skipTaskbar:     true,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.js'),
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
  splashWindow.show();

  splashWindow.on('closed', () => { splashWindow = null; });
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
}

// ─── Main window creation ─────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        1024,
    minHeight:       680,
    title:           'BulletAuto',
    icon:            path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#0A0A0A',
    show:            false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.js'),
    },
  });

  // Load the frontend
  if (isDev) {
    mainWindow.loadURL(CLIENT_URL);
  } else {
    mainWindow.loadFile(CLIENT_DIST);
  }

  // Show main window once the splash animation has finished (≥ 3.55 s) AND
  // the renderer is ready — whichever comes last.
  let splashDone    = false;
  let rendererReady = false;

  function maybeShowMain() {
    if (splashDone && rendererReady) {
      closeSplash();
      mainWindow.show();
      if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
      if (!isDev) autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }
  }

  // Splash signals completion via IPC
  ipcMain.once('splash:done', () => {
    splashDone = true;
    maybeShowMain();
  });

  // Safety fallback: show main window after 4 s even if IPC never fires
  const splashTimeout = setTimeout(() => {
    splashDone = true;
    maybeShowMain();
  }, 4000);

  mainWindow.once('ready-to-show', () => {
    rendererReady = true;
    maybeShowMain();
  });

  mainWindow.on('closed', () => {
    clearTimeout(splashTimeout);
    mainWindow = null;
  });

  // Open external links in the default browser, not Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ─── Application menu ─────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'BulletAuto',
      submenu: [
        { label: 'About BulletAuto', role: 'about' },
        { type: 'separator' },
        {
          label: 'Check for Updates…',
          click() {
            if (!isDev) autoUpdater.checkForUpdates();
            else dialog.showMessageBox(mainWindow, { message: 'Updates disabled in dev mode.' });
          },
        },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  buildMenu();
  createSplashWindow();  // show splash first
  createWindow();        // load main app in background

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Auto-updater events ──────────────────────────────────────────────────────
autoUpdater.on('checking-for-update', () => {
  sendToRenderer('updater:checking');
});

autoUpdater.on('update-available', (info) => {
  sendToRenderer('updater:available', info);
  dialog.showMessageBox(mainWindow, {
    type:    'info',
    title:   'Update Available',
    message: `Version ${info.version} is available and will be downloaded in the background.`,
    buttons: ['OK'],
  });
});

autoUpdater.on('update-not-available', () => {
  sendToRenderer('updater:not-available');
});

autoUpdater.on('download-progress', (progress) => {
  sendToRenderer('updater:progress', progress);
  if (mainWindow) {
    mainWindow.setProgressBar(progress.percent / 100);
    mainWindow.setTitle(`BulletAuto — Downloading update ${Math.round(progress.percent)}%`);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  sendToRenderer('updater:downloaded', info);
  if (mainWindow) mainWindow.setProgressBar(-1);

  dialog.showMessageBox(mainWindow, {
    type:      'info',
    title:     'Update Ready',
    message:   `Version ${info.version} has been downloaded. Restart to apply the update.`,
    buttons:   ['Restart Now', 'Later'],
    defaultId: 0,
  }).then(({ response }) => {
    if (response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (err) => {
  sendToRenderer('updater:error', { message: err.message });
  console.error('[AutoUpdater]', err);
});

// ─── IPC handlers ────────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion());
ipcMain.handle('app:check-update', () => {
  if (!isDev) return autoUpdater.checkForUpdates();
  return Promise.resolve(null);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sendToRenderer(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data);
  }
}
