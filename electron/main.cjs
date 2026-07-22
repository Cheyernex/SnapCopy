const { app, BrowserWindow, ipcMain, clipboard, globalShortcut, Tray, Menu, nativeImage, shell, dialog } = require('electron');
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
let SESSION_FILE;

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



// ─── Session persistence (Supabase auth) ───
function getSessionData() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading session file:', e);
  }
  return {};
}

function setSessionItem(key, value) {
  try {
    const data = getSessionData();
    data[key] = value;
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing session file:', e);
  }
}

function removeSessionItem(key) {
  try {
    const data = getSessionData();
    delete data[key];
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error removing session item:', e);
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

function startProductionServer(retryPort) {
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
  const port = retryPort || 15174;

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

  server.listen(port, '127.0.0.1', () => {
    const assignedPort = server.address().port;
    console.log(`SnapCopy server running at http://127.0.0.1:${assignedPort}`);
    if (mainWindow) {
      mainWindow.loadURL(`http://127.0.0.1:${assignedPort}`);
    }
  });

  server.on('error', (err) => {
    console.error('Failed to start production server:', err);
    // Retry with random port if fixed port is taken
    if (port === 15174) {
      server.listen(0, '127.0.0.1', () => {
        const assignedPort = server.address().port;
        console.log(`SnapCopy server running (fallback port) at http://127.0.0.1:${assignedPort}`);
        if (mainWindow) {
          mainWindow.loadURL(`http://127.0.0.1:${assignedPort}`);
        }
      });
    } else {
      if (mainWindow) {
        const indexPath = path.resolve(__dirname, '..', 'dist', 'index.html');
        mainWindow.loadFile(indexPath);
      }
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

  ipcMain.handle('send-email', async (event, emailData) => {
    let apiKey = process.env.VITE_RESEND_API_KEY || emailData.apiKey;
    let fromEmail = process.env.VITE_RESEND_FROM_EMAIL || emailData.from || 'cmtdevsolutions@gestricon.com';

    if (!apiKey) {
      try {
        const envPath = path.join(__dirname, '..', '.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const keyMatch = envContent.match(/VITE_RESEND_API_KEY=(.+)/);
          if (keyMatch && keyMatch[1]) apiKey = keyMatch[1].trim();
          const fromMatch = envContent.match(/VITE_RESEND_FROM_EMAIL=(.+)/);
          if (fromMatch && fromMatch[1]) fromEmail = fromMatch[1].trim();
        }
      } catch (e) {}
    }

    if (!apiKey) {
      console.warn('Resend API key not found in process.env or .env');
      return { success: false, error: 'Resend API key is missing' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: fromEmail,
          to: emailData.to || ['cmtdevsolutions@gestricon.com'],
          subject: emailData.subject,
          html: emailData.html,
          attachments: emailData.attachments
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        console.error('Resend API Error:', resData);
        return { success: false, error: resData.message || JSON.stringify(resData) };
      }
      return { success: true, data: resData };
    } catch (err) {
      console.error('Failed to send email via Resend in main process:', err);
      return { success: false, error: err.message };
    }
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
  SESSION_FILE = path.join(app.getPath('userData'), 'session.json');

  ipcMain.handle('get-snippets', getSnippets);
  ipcMain.handle('save-snippets', (event, snippets) => saveSnippets(snippets));
  ipcMain.handle('session-get-item', (event, key) => getSessionData()[key] ?? null);
  ipcMain.handle('session-set-item', (event, key, value) => setSessionItem(key, value));
  ipcMain.handle('session-remove-item', (event, key) => removeSessionItem(key));
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

  // Backup Export/Import Handlers
  ipcMain.handle('export-backup', async (event, data) => {
    if (!mainWindow) return { success: false };
    try {
      const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportar Respaldo de SnapCopy',
        defaultPath: `SnapCopy-Backup-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });
      if (filePath) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return { success: true, filePath };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
    return { success: false, cancelled: true };
  });

  ipcMain.handle('import-backup', async () => {
    if (!mainWindow) return { success: false };
    try {
      const { filePaths } = await dialog.showOpenDialog(mainWindow, {
        title: 'Importar Respaldo de SnapCopy',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      });
      if (filePaths && filePaths.length > 0) {
        const content = fs.readFileSync(filePaths[0], 'utf-8');
        const parsed = JSON.parse(content);
        return { success: true, data: parsed };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
    return { success: false, cancelled: true };
  });

  // Global Shortcut Registration (Ctrl+Shift+V)
  try {
    globalShortcut.register('CommandOrControl+Shift+V', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('focus-search');
      }
    });
  } catch (err) {
    console.error('Failed to register global shortcut:', err);
  }

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
      // Re-check for updates to ensure we download the absolute latest version
      const checkResult = await autoUpdater.checkForUpdates();
      if (checkResult?.updateInfo) {
        await autoUpdater.downloadUpdate();
        return { success: true, version: checkResult.updateInfo.version };
      }
      return { error: 'No update found' };
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

  // Check for updates automatically in production 5s after startup and every hour thereafter
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(err => console.error('Initial update check error:', err));
    }, 5000);

    setInterval(() => {
      autoUpdater.checkForUpdates().catch(err => console.error('Periodic update check error:', err));
    }, 3600000); // every hour
  }

  // Register global hotkeys: Ctrl + Alt + S (Toggle Show/Hide) & Ctrl + Shift + V (Quick Search)
  try {
    globalShortcut.register('CommandOrControl+Alt+S', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('focus-search');
        }
      }
    });
  } catch (err) {
    console.warn('Could not register Ctrl+Alt+S:', err);
  }

  try {
    globalShortcut.register('CommandOrControl+Shift+V', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('focus-search');
      }
    });
  } catch (err) {
    console.warn('Could not register Ctrl+Shift+V:', err);
  }

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
