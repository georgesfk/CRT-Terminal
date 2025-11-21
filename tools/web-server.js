const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '..')));

// PTY backend (optional)
let ptyAvailable = false;
let nodePty;
try {
  nodePty = require('node-pty');
  ptyAvailable = true;
  console.log('node-pty loaded for web PTY backend');
} catch (e) {
  console.log('node-pty not available: web PTY will use stub echo');
}

// For each websocket connection we keep a map of PTYs keyed by id
wss.on('connection', (ws, req) => {
  console.log('websocket connected');
  const ptys = new Map();

  function send(obj){
    try{ ws.send(JSON.stringify(obj)); }catch(e){}
  }

  ws.on('message', (raw) => {
    let msg = raw;
    try { msg = JSON.parse(raw); } catch(e) { /* plain text fallback */ }

    if (typeof msg === 'string') {
      // echo fallback
      send({ type: 'output', data: '\r\n[stub] ' + msg });
      return;
    }

    const { type } = msg;
    if (type === 'create') {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
      if (ptyAvailable) {
        const shell = msg.shell || process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : 'bash');
        const p = nodePty.spawn(shell, [], {
          name: 'xterm-color', cols: msg.cols || 80, rows: msg.rows || 24, cwd: process.env.HOME, env: process.env
        });
        p.onData(d => send({ type: 'output', id, data: d }));
        p.onExit(() => send({ type: 'exit', id }));
        ptys.set(id, p);
        send({ type: 'created', id });
      } else {
        // stub: provide a simple line-buffered pseudo-shell that can run non-interactive commands
        const stubPty = { stub: true, buffer: '' };
        ptys.set(id, stubPty);
        send({ type: 'created', id });
        send({ type: 'output', id, data: '\x1b[32m[PTY stub] Minimal shell (no pty).\x1b[0m\r\n$ ' });
      }
    } else if (type === 'data') {
      const p = ptys.get(msg.id);
      if (!p) return;
      if (p.stub) {
        // buffer input and execute when newline received
        const chunk = msg.data || '';
        // append to buffer, but also echo the typed characters for UX
        send({ type: 'output', id: msg.id, data: chunk });
        p.buffer += chunk.replace(/\r/g, '\n');
        // if buffer contains a newline, split into lines and execute each full line
        if (p.buffer.indexOf('\n') !== -1) {
          const parts = p.buffer.split('\n');
          // last part may be incomplete
          p.buffer = parts.pop();
          const { exec } = require('child_process');
          (async () => {
            for (const line of parts) {
              const cmd = line.trim();
              if (!cmd) {
                send({ type: 'output', id: msg.id, data: '\r\n$ ' });
                continue;
              }
              try {
                // run the command with a timeout to avoid hanging
                exec(cmd, { cwd: process.env.HOME, env: process.env, timeout: 5000 }, (err, stdout, stderr) => {
                  if (stdout) send({ type: 'output', id: msg.id, data: stdout.replace(/\n/g,'\r\n') });
                  if (stderr) send({ type: 'output', id: msg.id, data: stderr.replace(/\n/g,'\r\n') });
                  if (err && err.code === null) {
                    // timeout or signal
                    send({ type: 'output', id: msg.id, data: '\r\n[command timed out]\r\n' });
                  }
                  // send prompt after command
                  send({ type: 'output', id: msg.id, data: '\r\n$ ' });
                });
              } catch (e) {
                send({ type: 'output', id: msg.id, data: '\r\n[stub error] ' + String(e) + '\r\n$ ' });
              }
            }
          })();
        }
      } else {
        p.write(msg.data);
      }
    } else if (type === 'resize') {
      const p = ptys.get(msg.id);
      if (p && !p.stub) p.resize(msg.cols, msg.rows);
    } else if (type === 'kill') {
      const p = ptys.get(msg.id);
      if (p && !p.stub) { try{ p.kill(); }catch(e){} }
      ptys.delete(msg.id);
    }
  });

  ws.on('close', () => {
    // cleanup
    for (const [id,p] of ptys) {
      if (p && p.kill) try{ p.kill(); }catch(e){}
    }
    ptys.clear();
  });

  // initial message
  send({ type: 'ready', msg: 'web PTY backend ready', ptyAvailable });
});

const port = process.env.PORT || 3000;
server.listen(port, () => console.log('Web UI available at http://localhost:' + port));
