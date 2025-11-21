const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
let pty;
let hasRealPty = false;
try {
  pty = require('node-pty');
  hasRealPty = true;
} catch (e) {
  // Fallback stub for environments where node-pty cannot be installed.
  // This allows the renderer/UI to be developed and tested without native modules.
  console.warn('node-pty not available, using stub PTY. Real shell disabled.');
  pty = {
    spawn: (shell, args, opts) => {
      let dataCb = () => {};
      let exitCb = () => {};
      const obj = {
        write: (d) => {
          // Echo back input to simulate a shell
          setTimeout(() => dataCb('\r\n' + d), 10);
        },
        resize: (c, r) => {},
        kill: () => { setTimeout(() => exitCb(), 10); },
        onData: (cb) => { dataCb = cb; },
        onExit: (cb) => { exitCb = cb; }
      };
      // simulate a welcome message
      setTimeout(() => dataCb('\x1b[32m[PTY stub] Shell not available.\x1b[0m\r\n$ '), 50);
      return obj;
    }
  };
}

const THEMES_DIR = path.join(__dirname, 'themes');
const Store = require('electron-store');
const store = new Store({ name: 'crt-terminal' });
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

let mainWindow;
let shellPty;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Garbage collect pty on close
  mainWindow.on('closed', () => {
    if (shellPty) {
      shellPty.kill();
      shellPty = null;
    }
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Spawn a shell
// Session management supporting multiple tabs
const sessions = new Map();
let currentSessionId = null;

function createPtyForSession(id, shellPath, cols = 80, rows = 24, sender) {
  const shell = shellPath || process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
  const p = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols,
    rows,
    cwd: process.env.HOME,
    env: process.env
  });
  p.onData((data) => {
    if (mainWindow) mainWindow.webContents.send('session-data', id, data);
  });
  p.onExit(() => {
    if (mainWindow) mainWindow.webContents.send('session-data', id, '\r\n[session exited]');
    sessions.delete(id);
  });
  return p;
}

ipcMain.handle('session-create', (event, name, shellPath) => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
  try {
    const p = createPtyForSession(id, shellPath);
    sessions.set(id, { id, name: name || id, p });
    currentSessionId = id;
    return { id, name: name || id };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('session-list', () => {
  return Array.from(sessions.values()).map(s => ({ id: s.id, name: s.name }));
});

ipcMain.handle('session-switch', (event, id) => {
  if (!sessions.has(id)) return { error: 'no-such-session' };
  currentSessionId = id;
  return { ok: true };
});

ipcMain.handle('session-close', (event, id) => {
  const s = sessions.get(id);
  if (s) {
    try { s.p.kill(); } catch (e) {}
    sessions.delete(id);
    if (currentSessionId === id) currentSessionId = sessions.size ? sessions.keys().next().value : null;
    return { ok: true };
  }
  return { error: 'no-such-session' };
});

ipcMain.on('pty-write', (event, data) => {
  if (currentSessionId && sessions.has(currentSessionId)) sessions.get(currentSessionId).p.write(data);
});

ipcMain.on('pty-resize', (event, cols, rows) => {
  if (currentSessionId && sessions.has(currentSessionId)) sessions.get(currentSessionId).p.resize(cols, rows);
});

ipcMain.handle('get-themes', async () => {
  try {
    const files = await fs.promises.readdir(THEMES_DIR);
    const themes = [];
    for (const f of files) {
      if (f.endsWith('.json')) {
        const raw = await fs.promises.readFile(path.join(THEMES_DIR, f), 'utf8');
        themes.push(JSON.parse(raw));
      }
    }
    return themes;
  } catch (e) {
    return [];
  }
});

ipcMain.handle('import-theme', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Import theme',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (canceled || !filePaths || !filePaths[0]) return null;
  const raw = await fs.promises.readFile(filePaths[0], 'utf8');
  const theme = JSON.parse(raw);
  const dest = path.join(THEMES_DIR, `${theme.id || Date.now()}.json`);
  await fs.promises.writeFile(dest, JSON.stringify(theme, null, 2), 'utf8');
  // refresh store or return theme
  return theme;
});

ipcMain.handle('export-theme', async (event, theme) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Export theme',
    defaultPath: `${theme.id || 'theme'}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  if (canceled || !filePath) return false;
  await fs.promises.writeFile(filePath, JSON.stringify(theme, null, 2), 'utf8');
  return true;
});

ipcMain.handle('save-theme', async (event, theme) => {
  try {
    const dest = path.join(THEMES_DIR, `${theme.id || Date.now()}.json`);
    await fs.promises.writeFile(dest, JSON.stringify(theme, null, 2), 'utf8');
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('delete-theme', async (event, id) => {
  try {
    const file = path.join(THEMES_DIR, `${id}.json`);
    if (fs.existsSync(file)) {
      await fs.promises.unlink(file);
      return { ok: true };
    }
    // try to find by name
    const files = await fs.promises.readdir(THEMES_DIR);
    for (const f of files) {
      if (f.endsWith('.json')) {
        const raw = await fs.promises.readFile(path.join(THEMES_DIR, f), 'utf8');
        const t = JSON.parse(raw);
        if ((t.id && t.id.toString() === id.toString()) || t.name === id) {
          await fs.promises.unlink(path.join(THEMES_DIR, f));
          return { ok: true };
        }
      }
    }
    return { error: 'not-found' };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('get-config', async () => {
  try {
    const cfg = store.get('config', {});
    return cfg;
  } catch (e) {
    return {};
  }
});

ipcMain.handle('save-config', async (event, cfg) => {
  try {
    store.set('config', cfg);
    return true;
  } catch (e) {
    return false;
  }
});
