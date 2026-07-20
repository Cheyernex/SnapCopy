const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, nativeImage, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Configure autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.forceDevUpdateConfig = true;

// Disable GPU acceleration - prevents 0x80000003 crashes on corporate machines
// where security policies (CrowdStrike, WDAC) block DXGI/GPU hardware access
//
// Note: disableHardwareAcceleration + use-gl=swiftshader forces Chromium
// to use software-only rendering (CPU) rather than touching DXGI/D3D11
app.disableHardwareAcceleration();

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow;
let tray = null;

let SNIPPETS_FILE;

// Read snippets from JSON file
function getSnippets() {
  const defaultObj = {
    workspaces: ['General'],
    currentWorkspace: 'General',
    snippets: []
  };

  if (!fs.existsSync(SNIPPETS_FILE)) {
    try {
      fs.writeFileSync(SNIPPETS_FILE, JSON.stringify(defaultObj, null, 2));
      return defaultObj;
    } catch (e) {
      console.error('Error creating snippets file:', e);
      return defaultObj;
    }
  }
  try {
    const data = fs.readFileSync(SNIPPETS_FILE, 'utf-8');
    const parsed = JSON.parse(data);

    // Check if it is the old array format and migrate it
    if (Array.isArray(parsed)) {
      const migrated = {
        workspaces: ['General'],
        currentWorkspace: 'General',
        snippets: parsed.map(s => ({
          ...s,
          workspace: s.workspace || 'General'
        }))
      };
      saveSnippets(migrated);
      return migrated;
    }

    // Ensure standard object structure is valid
    if (!parsed || typeof parsed !== 'object') {
      return defaultObj;
    }

    // Safety check on workspaces properties
    if (!parsed.workspaces || !Array.isArray(parsed.workspaces)) {
      parsed.workspaces = ['General'];
    }
    if (!parsed.currentWorkspace) {
      parsed.currentWorkspace = parsed.workspaces[0] || 'General';
    }
    if (!parsed.snippets || !Array.isArray(parsed.snippets)) {
      parsed.snippets = [];
    }

    return parsed;
  } catch (e) {
    console.error('Error reading snippets file:', e);
    return defaultObj;
  }
}

// Write snippets to JSON file
function saveSnippets(snippets) {
  try {
    fs.writeFileSync(SNIPPETS_FILE, JSON.stringify(snippets, null, 2));
    return true;
  } catch (e) {
    console.error('Error writing snippets file:', e);
    return false;
  }
}



function createTray() {
  try {
    const iconPath = path.join(__dirname, 'icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      console.error('Tray icon is empty, running without tray support.');
      tray = null;
      return;
    }
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Abrir SnapCopy', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
      { type: 'separator' },
      {
        label: 'Salir', click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setToolTip('SnapCopy - Copia rápida');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (err) {
    console.error('Failed to create tray, falling back to standard taskbar lifecycle:', err);
    tray = null;
  }
}

function startProductionServer() {
  const distPath = path.resolve(__dirname, '..', 'dist');
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(distPath, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        fs.readFile(path.join(distPath, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(500);
            res.end('Internal Server Error');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data2);
        });
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  server.listen(0, '127.0.0.1', () => {
    const assignedPort = server.address().port;
    console.log(`SnapCopy server running at http://127.0.0.1:${assignedPort}`);
    if (mainWindow) {
      mainWindow.loadURL(`http://127.0.0.1:${assignedPort}`);
    }
  });

  server.on('error', (err) => {
    console.error('Failed to start production server:', err);
    if (mainWindow) {
      const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html');
      mainWindow.loadFile(indexPath);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 850,
    minHeight: 600,
    title: 'SnapCopy',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // OAuth callback server for system browser flow (PKCE)
  let pendingAuthResolve = null;
  let authServer = null;

  function startAuthServer() {
    const port = 15173;
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/favicon.ico' || url.pathname === '/favicon.png') {
        const iconPath = path.join(__dirname, 'icon.png');
        if (fs.existsSync(iconPath)) {
          const icon = fs.readFileSync(iconPath);
          res.writeHead(200, { 'Content-Type': 'image/png' });
          res.end(icon);
        } else {
          res.writeHead(204);
          res.end();
        }
        return;
      }
      if (url.pathname === '/auth/callback') {
        const code = url.searchParams.get('code');
        if (code) {
          // Capture the auth code and resolve the pending promise
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SnapCopy</title><link rel="icon" href="/favicon.png" type="image/png"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0b0f19;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}.card{background:rgba(15,23,42,.8);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:48px 40px;max-width:400px}.check{width:64px;height:64px;border-radius:50%;background:rgba(16,185,129,.15);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;color:#10b981;font-size:32px}h2{margin:0 0 8px;font-weight:600}p{margin:0;color:#94a3b8;font-size:.9rem}</style></head><body><div class="card"><div class="check">&#10003;</div><h2>Autenticación completada</h2><p>Puedes cerrar esta ventana.</p></div></body></html>`);
          if (pendingAuthResolve) {
            pendingAuthResolve(code);
            pendingAuthResolve = null;
          }
        } else {
          res.writeHead(400);
          res.end('Missing code parameter');
        }
        return;
      }
      res.writeHead(404);
      res.end('Not found');
    });
    server.listen(port, '127.0.0.1', () => {
      console.log('Auth callback server on port', port);
    });
    server.on('error', () => { authServer = null; });
    authServer = server;
  }
  startAuthServer();

  ipcMain.handle('open-auth-url', async (event, url) => {
    return new Promise((resolve, reject) => {
      pendingAuthResolve = resolve;
      shell.openExternal(url);
      setTimeout(() => {
        if (pendingAuthResolve) {
          pendingAuthResolve = null;
          reject(new Error('Auth timeout'));
        }
      }, 300000);
    });
  });

  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    startProductionServer();
  }



  // Prevent app from quitting when window is closed only if system tray is successfully loaded
  mainWindow.on('close', (event) => {
    if (!app.isQuitting && tray !== null) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  SNIPPETS_FILE = path.join(app.getPath('userData'), 'snippets.json');

  // Migrate data from old app name (app-util -> snap-copy)
  const oldUserData = path.join(app.getPath('appData'), 'app-util');
  const oldSnippetsFile = path.join(oldUserData, 'snippets.json');
  if (!fs.existsSync(SNIPPETS_FILE) && fs.existsSync(oldSnippetsFile)) {
    try {
      const oldData = JSON.parse(fs.readFileSync(oldSnippetsFile, 'utf-8'));
      fs.writeFileSync(SNIPPETS_FILE, JSON.stringify(oldData, null, 2));
      console.log('Migrated snippets from old app-util path');
    } catch (e) {
      console.error('Failed to migrate old data:', e);
    }
  }
  ipcMain.handle('get-snippets', getSnippets);
  ipcMain.handle('save-snippets', (event, snippets) => saveSnippets(snippets));
  ipcMain.handle('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
    return true;
  });
  ipcMain.handle('set-auto-start', (event, enable) => {
    app.setLoginItemSettings({ openAtLogin: enable });
    return true;
  });
  ipcMain.handle('get-auto-start', () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  // Auto-Updater handlers & listeners
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info?.version);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-not-available', {
        version: info?.version,
      });
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-progress', {
        percent: Math.round(progressObj.percent || 0),
        bytesPerSecond: progressObj.bytesPerSecond || 0,
        transferred: progressObj.transferred || 0,
        total: progressObj.total || 0,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloaded', {
        version: info.version,
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('AutoUpdater error:', err);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', err.message || 'Error al verificar actualización');
    }
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { status: 'ok', updateInfo: result?.updateInfo };
    } catch (err) {
      console.error('Failed to check updates:', err);
      return { error: err.message };
    }
  });

  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err) {
      console.error('Failed to download update:', err);
      return { error: err.message };
    }
  });

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  createWindow();
  createTray();

  // Check for updates automatically in production 5s after startup
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => console.error('Initial update check error:', err));
    }, 5000);
  }

  // Register global hotkey (Ctrl + Alt + S) to show/hide the app
  globalShortcut.register('CommandOrControl+Alt+S', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
