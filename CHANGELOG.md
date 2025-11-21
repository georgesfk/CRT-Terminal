# CRT Terminal — Changelog

## v0.1.0 (2025-11-21)

### Features
- Full Electron + xterm.js terminal with authentic CRT effects
  - Scanlines animation with adjustable opacity and speed
  - Glow/bloom effect with intensity control
  - Chromatic aberration simulation
  - Blur filter for classic CRT look
  - Vignette effect (hardcoded in CSS)

- Multi-session support (onglets/tabs)
  - Create, switch, close terminal sessions
  - Rename tabs via double-click or context menu
  - Persistent session management via electron-store

- Theme system
  - 6 built-in themes: Green Phosphor, Amber, Magenta, Cyan, White, Retro Blue, Neon
  - Import/export custom themes as JSON
  - Save/delete themes from library
  - Live theme switching with CSS variables

- Configuration panel
  - Adjust CRT effects in real-time
  - Persistent config (saved to electron-store)
  - Glow, scanlines, blur, aberration, speed controls

- Web mode (no Electron required)
  - Lightweight Express + WebSocket server (`npm run web`)
  - Test UI in browser at http://localhost:3000
  - PTY stub echo (can use real node-pty if installed)

- Cross-platform
  - Windows (NSIS installer + portable)
  - macOS (DMG + zip)
  - Linux (AppImage + deb)
  - electron-builder config included

### Technical Stack
- Electron 26.x
- xterm.js 5.x with addon-fit
- node-pty 0.11.x (optional, for real shell)
- electron-store for config/sessions persistence
- Express + WebSocket for web mode
- Jest for unit tests

### Included Files
- main.js: Electron main process, session/PTY/theme/config IPC handlers
- preload.js: Secure context bridge API
- src/renderer.js: UI logic, xterm initialization, theme/session management
- src/themeManager.js: Theme utilities
- src/sessionManager.js: Session persistence (electron-store)
- src/tabManager.js: Advanced tab/onglet UI management
- index.html: UI markup
- assets/styles.css: CRT effects and layout
- assets/tabs-advanced.css: Tab UI enhancements
- tools/web-server.js: Express + WebSocket PTY backend
- electron-builder.config.js: Packaging configuration
- themes/*.json: 7 color schemes

### Known Limitations
- Web mode uses stub PTY (echo) unless node-pty is installed on the server
- Real shell requires node-pty compilation (may fail on some systems)
- No tab drag-and-drop yet
- No native emoji/wide character support optimization

### Future Improvements
- Tab drag-and-drop reordering
- Tab groups/workspaces
- Detachable windows
- Profile system (quick presets)
- Plugin/extension system
- Color palette editor
- Recording/replay terminal sessions
- Search in scrollback
