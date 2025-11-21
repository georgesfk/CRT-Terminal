# Components

This file describes the responsibilities and interactions of the main components.

1) Electron Main (`main.js`)
- Creates `BrowserWindow`, loads `index.html`.
- Manages real PTY sessions using `node-pty` when available.
- Exposes IPC handlers for session creation, write, resize, close, theme/config persistence.

2) Preload (`preload.js`)
- Uses `contextBridge.exposeInMainWorld` to expose a controlled API to renderer. Example APIs: `startPty`, `writePty`, `resizePty`, `getThemes`, `saveConfig`.

3) Renderer (`index.html`, `src/renderer.js`, `assets/styles.css`)
- Renders UI: controls, terminal area, config panel, tabs.
- Initializes `xterm.js` and `FitAddon`; binds user interactions to PTY via Electron IPC or WebSocket (web mode).
- Applies CSS variables for CRT effects and themes.

4) Web Server (`tools/web-server.js`)
- Serves static files for browser mode.
- Provides WebSocket PTY backend: tries `node-pty`, falls back to a stub that can execute non-interactive commands.

5) Theme Manager (`src/themeManager.js` + `themes/*.json`)
- Loads and resolves themes, used by renderer to populate theme dropdown and apply colors.

6) Session/Tab Manager (`src/sessionManager.js`, `src/tabManager.js`)
- Persist sessions, support rename/close/select operations.
