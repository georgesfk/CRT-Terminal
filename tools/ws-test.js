const WebSocket = require('ws');

const url = 'ws://localhost:3000';
const ws = new WebSocket(url);

ws.on('open', () => {
  console.log('[test] connected');
  ws.send(JSON.stringify({ type: 'create' }));
});

let sessId = null;
let output = '';

ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data);
    if (msg.type === 'created') {
      sessId = msg.id;
      console.log('[test] session created:', sessId);
      // send a few non-interactive commands
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'data', id: sessId, data: 'pwd\n' }));
      }, 200);
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'data', id: sessId, data: 'ls -la\n' }));
      }, 800);
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'data', id: sessId, data: 'echo hello-from-stub\n' }));
      }, 1600);
      setTimeout(() => {
        console.log('[test] done sending commands, will exit in 2s');
        setTimeout(() => process.exit(0), 2000);
      }, 2600);
    } else if (msg.type === 'output') {
      if (msg.id === sessId) {
        output += msg.data;
        process.stdout.write(msg.data);
      }
    } else if (msg.type === 'ready') {
      console.log('[test] backend ready, ptyAvailable=', msg.ptyAvailable);
    }
  } catch (e) {
    console.log('[test] raw message:', data.toString());
  }
});

ws.on('error', (e) => console.error('[test] ws error', e));
ws.on('close', () => console.log('[test] ws closed'));
