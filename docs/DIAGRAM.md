# Architecture Diagram

```mermaid
flowchart LR
  subgraph Electron
    A[main.js] -->|IPC| B[preload.js]
    B -->|contextBridge| C[renderer (src/renderer.js)]
    A -->|node-pty| P[PTY processes]
  end

  subgraph Web
    C -->|WebSocket| W[tools/web-server.js]
    W -->|node-pty or stub| P2[PTY or stub]
  end

  C --> |xterm.js| X[Xterm UI]
  C --> |themes| T[themes/*.json]
  C --> |config| S[electron-store / localStorage]
```
