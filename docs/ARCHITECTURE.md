# CRT-Terminal — Architecture Overview

This document describes the high-level architecture of the CRT-Terminal project (Electron + Web fallback).

Key goals:
- Provide a retro CRT terminal UI (xterm.js) with CRT visual effects.
- Support real PTY via `node-pty` when available (Electron) and a WebSocket PTY backend for web mode.
- Offer multi-session/tab support, themes, and a configuration panel.

Top-level structure

- `main.js` — Electron main process, window creation, real PTY management, IPC handlers.
- `preload.js` — secure `contextBridge` API between renderer and main.
- `index.html` + `assets/` + `src/renderer.js` — renderer UI (works in Electron and browser mode).
- `tools/web-server.js` — Express + WebSocket server for running the app in a browser (hosts static files and implements PTY backend).
- `themes/*.json` — theme definitions (id, name, background, foreground, accent).
- `docs/` — architecture and operational documentation (this folder).

Design overview

- Renderer/UI: `xterm.js` provides terminal emulation. The renderer applies CSS variables to control CRT effects (glow, scanlines, blur, chromatic aberration).
- PTY layer:
  - Desktop (Electron): Uses `node-pty` in `main.js` to spawn real shells and exposes `onPtyData`, `writePty`, `resizePty` through IPC.
  - Web: `tools/web-server.js` hosts a WebSocket endpoint. Server attempts to use `node-pty` if available; otherwise a stub/back-end executes simple non-interactive commands.
- Themes & Config: Themes are JSON files. Renderer applies themes by setting CSS variables. Config is persisted via `electron-store` in Electron and `localStorage` in web mode.

Security considerations

- Do not expose arbitrary OS commands from a public web server. The web-server should be used locally for development only. In production, disable shell access or require authentication.
- The `preload.js` bridge exposes a minimal, explicit API instead of `nodeIntegration`.

Next steps / Roadmap

- Add end-to-end test harness for both Electron and web modes.
- Improve web PTY stub (or add authentication) for remote access.
- Add packaging CI (electron-builder) and release automation.
