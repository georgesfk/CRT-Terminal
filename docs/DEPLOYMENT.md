# Deployment & Running

This file explains how to run the project in both Electron (desktop) and Web (browser) modes, and how to build packages.

Prerequisites

- Node.js (v16+ recommended)
- npm
- For `node-pty` (native) support: system build tools (`build-essential`, `python3`, `pkg-config`, `libssl-dev`).

Run locally (web mode)

1. Install dependencies:

```bash
npm install
```

2. Start the web server (serves static files + WebSocket PTY backend):

```bash
npm run web
# then open http://localhost:3000
```

Notes: if `node-pty` is not installed, the web-server falls back to a stub that executes non-interactive commands.

Run locally (Electron)

1. Install dependencies (see above). Make sure `node-pty` builds successfully if you want real PTYs.
2. Start Electron:

```bash
npm start
```

Packaging (desktop)

Electron build is configured via `electron-builder` (see `package.json` and `electron-builder.config.js`). Typical command:

```bash
npm run dist
```

CI / GitHub Actions

- Add a workflow that installs dependencies, runs tests, and optionally builds Electron packages for the target OS.
