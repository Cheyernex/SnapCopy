const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSnippets: () => ipcRenderer.invoke('get-snippets'),
  saveSnippets: (snippets) => ipcRenderer.invoke('save-snippets', snippets),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  openAuthUrl: (url) => ipcRenderer.invoke('open-auth-url', url),
});
