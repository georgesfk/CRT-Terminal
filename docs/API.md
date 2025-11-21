# APIs and Protocols

This document defines the APIs used between renderer / main (Electron) and between renderer / web-backend (WebSocket).

1) Preload / Renderer IPC (Electron)

- `ipc.invoke('get-themes')` → returns `Array<Theme>`
- `ipc.invoke('get-config')` → returns current `Config` object
- `ipc.invoke('save-config', cfg)` → persists configuration
- `ipc.invoke('create-session', { name, shell })` → creates a new PTY session, returns `{ id, name }`
- `ipc.send('pty-write', { id, data })` → write data to PTY
- `ipc.send('pty-resize', { id, cols, rows })` → resize PTY
- Events: `ipc.on('pty-data', (id, data) => {})`, `ipc.on('pty-exit', (id) => {})`

2) WebSocket Protocol (Web Mode)

Messages are JSON objects. Typical fields:
- From client → server:
  - `{ type: 'create', cols?, rows?, shell? }` → create a new session; server replies `created` with `id`.
  - `{ type: 'data', id, data }` → user input for PTY session `id`.
  - `{ type: 'resize', id, cols, rows }` → resize PTY.
  - `{ type: 'kill', id }` → terminate session.

- From server → client:
  - `{ type: 'created', id }`
  - `{ type: 'output', id, data }` → PTY output chunk (text, may include ANSI escape codes)
  - `{ type: 'exit', id }`
  - `{ type: 'ready', ptyAvailable: boolean }`

3) Theme JSON format

Each theme JSON in `/themes` follows shape:

```
{
  "id": "default",
  "name": "Green Phosphor",
  "background": "#001100",
  "foreground": "#33ff33",
  "accent": "#33ff33",
  "description": "Retro green phosphor"
}
```

4) Configuration Schema

Example `Config` object stored by `electron-store` or `localStorage`:

```
{
  "glow": 0.6,
  "scan": 0.25,
  "blur": 0.6,
  "aberr": 2,
  "scanSpeed": 0.8,
  "theme": "default"
}
```
