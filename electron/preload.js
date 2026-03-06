'use strict';
/**
 * electron/preload.js
 * Exposes a safe, limited API to the renderer process via contextBridge.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion:   ()        => ipcRenderer.invoke('app:version'),
  checkUpdate:  ()        => ipcRenderer.invoke('app:check-update'),
  onUpdater:    (channel, callback) => {
    const validChannels = [
      'updater:checking',
      'updater:available',
      'updater:not-available',
      'updater:progress',
      'updater:downloaded',
      'updater:error',
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  },
});

// Expose splash-done signaller for splash.html
contextBridge.exposeInMainWorld('electronSplash', {
  done: () => ipcRenderer.send('splash:done'),
});
