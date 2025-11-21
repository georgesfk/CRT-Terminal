const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startPty: (cols, rows, shell) => ipcRenderer.send('pty-start', cols, rows, shell),
  onPtyData: (cb) => ipcRenderer.on('pty-data', (e, d) => cb(d)),
  onPtyExit: (cb) => ipcRenderer.on('pty-exit', cb),
  writePty: (data) => ipcRenderer.send('pty-write', data),
  resizePty: (cols, rows) => ipcRenderer.send('pty-resize', cols, rows),
  getThemes: () => ipcRenderer.invoke('get-themes'),
  importTheme: () => ipcRenderer.invoke('import-theme'),
  exportTheme: (theme) => ipcRenderer.invoke('export-theme', theme),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),
  // session management
  createSession: (name, shell) => ipcRenderer.invoke('session-create', name, shell),
  listSessions: () => ipcRenderer.invoke('session-list'),
  switchSession: (id) => ipcRenderer.invoke('session-switch', id),
  closeSession: (id) => ipcRenderer.invoke('session-close', id),
  onSessionData: (cb) => ipcRenderer.on('session-data', (e, id, data) => cb(id, data))
  ,
  saveTheme: (theme) => ipcRenderer.invoke('save-theme', theme),
  deleteTheme: (id) => ipcRenderer.invoke('delete-theme', id)
});
