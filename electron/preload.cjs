const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSnippets: () => ipcRenderer.invoke('get-snippets'),
  saveSnippets: (snippets) => ipcRenderer.invoke('save-snippets', snippets),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  openAuthUrl: (url) => ipcRenderer.invoke('open-auth-url', url),

  // Auto-Updater IPC
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback) => ipcRenderer.on('update-available', (_event, value) => callback(value)),
  onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (_event, value) => callback(value)),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (_event, value) => callback(value)),
  onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', (_event, value) => callback(value)),
  onUpdateError: (callback) => ipcRenderer.on('update-error', (_event, value) => callback(value)),
});
