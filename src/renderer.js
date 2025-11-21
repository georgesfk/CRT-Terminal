// Polyfill require() for web mode (browser-friendly module loader)
if (typeof require === 'undefined') {
  window.require = function(module) {
    if (module === 'xterm') return { Terminal: window.Terminal };
    if (module === 'xterm-addon-fit') return { FitAddon: window.FitAddon ? window.FitAddon.FitAddon : null };
    if (module === './themeManager') return themeManager;
    throw new Error('Module not found: ' + module);
  };
}

// Simple theme manager inline (no require() needed for web mode)
const themeManager = {
  _themes: [],
  setThemes(list) { this._themes = list; },
  getAll() { return this._themes; },
  getThemeById(id) { return this._themes.find(t => t.id === id); },
  getThemeByName(name) { return this._themes.find(t => t.name === name); }
};

// Use global Terminal and FitAddon from loaded scripts (browser mode)
// In Electron mode, these would be from require()
const Terminal = window.Terminal || (typeof require !== 'undefined' ? require('xterm').Terminal : null);
const FitAddon = window.FitAddon ? window.FitAddon.FitAddon : (typeof require !== 'undefined' ? require('xterm-addon-fit').FitAddon : null);

if (!Terminal || !FitAddon) {
  console.error('Terminal or FitAddon not available');
}

const termEl = document.getElementById('terminal');
const startBtn = document.getElementById('startBtn');
const shellSelect = document.getElementById('shellSelect');
const themeList = document.getElementById('themeList');
const importBtn = document.getElementById('importTheme');
const exportBtn = document.getElementById('exportTheme');
const deleteBtn = document.getElementById('deleteTheme');
const saveCfgBtn = document.getElementById('saveCfg');

const glow = document.getElementById('glow');
const scan = document.getElementById('scan');
const blur = document.getElementById('blur');
const aberr = document.getElementById('aberr');
const scanSpeed = document.getElementById('scanSpeed');

// Create or find a small on-page debug log so the user can see logs without DevTools
let debugEl = document.getElementById('debugLog');
if (!debugEl) {
  try {
    debugEl = document.createElement('pre');
    debugEl.id = 'debugLog';
    debugEl.style.position = 'fixed';
    debugEl.style.right = '8px';
    debugEl.style.bottom = '8px';
    debugEl.style.zIndex = 99999;
    debugEl.style.background = 'rgba(0,0,0,0.6)';
    debugEl.style.color = 'white';
    debugEl.style.padding = '6px';
    debugEl.style.fontSize = '12px';
    debugEl.style.maxWidth = '320px';
    debugEl.style.maxHeight = '160px';
    debugEl.style.overflow = 'auto';
    debugEl.style.borderRadius = '6px';
    debugEl.style.whiteSpace = 'pre-wrap';
    document.body.appendChild(debugEl);
  } catch (e) {
    // document may not be ready; swallow and leave debugEl null
    debugEl = null;
  }
}

function uiLog(...args) {
  try {
    const s = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    if (debugEl) {
      debugEl.textContent = s;
    }
    // also keep console logs for DevTools
    console.log(...args);
  } catch (e) { console.log(...args); }
}

let term, fit;
let sessions = [];
let activeSession = null;

const tabsEl = document.getElementById('tabs');
const newTabBtn = document.getElementById('newTab');

// Detect mode: Electron (window.api) or Web (WebSocket)
const isElectron = !!window.api;
let ws = null;
let wsReady = false;

function setupWebSocket(){
  if (isElectron) return;
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${location.host}`);
  ws.addEventListener('open', ()=>{ wsReady = true; console.log('[web] ws open'); });
  ws.addEventListener('message', (ev)=>{
    let msg = ev.data;
    try{ msg = JSON.parse(ev.data); }catch(e){}
    if (typeof msg === 'string') {
      if (term) term.write(msg);
      return;
    }
    if (msg.type === 'output') {
      if (msg.id === activeSession && term) term.write(msg.data);
    } else if (msg.type === 'created') {
      const id = msg.id;
      sessions.push({ id, name: 'session-' + sessions.length });
      activeSession = id;
      renderTabs();
    } else if (msg.type === 'ready') {
      console.log('[web] backend ready', msg);
    }
  });
  ws.addEventListener('error', (e) => console.error('[web] ws error', e));
  ws.addEventListener('close', () => { wsReady = false; console.log('[web] ws closed'); });
}

function renderTabs(){
  tabsEl.innerHTML = '';
  sessions.forEach(s => {
    const b = document.createElement('div');
    b.className = 'tab' + (s.id === activeSession ? ' active' : '');
    b.textContent = s.name || s.id;
    b.onclick = async () => {
      if (isElectron) {
        await window.api.switchSession(s.id);
      } else {
        activeSession = s.id;
      }
      renderTabs();
    };
    tabsEl.appendChild(b);
  });
}

newTabBtn.addEventListener('click', async ()=>{
  if (isElectron) {
    const r = await window.api.createSession('session-' + (sessions.length+1));
    if (r && r.id){ sessions.push({id:r.id,name:r.name}); activeSession = r.id; renderTabs(); }
  } else {
    setupWebSocket();
    if (!ws || !wsReady) { alert('WebSocket not ready'); return; }
    ws.send(JSON.stringify({ type: 'create' }));
  }
});

function createTerminal() {
  if (term) return; // already created
  term = new Terminal({
    cursorBlink: true,
    scrollback: 10000,
    fontFamily: 'Monaco, Menlo, "Courier New", monospace',
    theme: {}
  });
  fit = new FitAddon();
  term.loadAddon(fit);
  term.open(termEl);
  termEl.classList.add('crt');

  term.onData((data) => {
    if (isElectron) {
      window.api.writePty(data);
    } else {
      setupWebSocket();
      if (ws && wsReady && activeSession) ws.send(JSON.stringify({ type: 'data', id: activeSession, data }));
    }
  });

  if (isElectron) {
    window.api.onSessionData((id, d) => {
      if (!term) return;
      if (id === activeSession) term.write(d);
    });
    window.api.onPtyExit(() => {
      term.writeln('\r\n[process exited]');
    });
  }

  resizePty();
  window.addEventListener('resize', () => {
    if (fit) fit.fit();
    resizePty();
  });
}

function resizePty() {
  if (!term || !fit) return;
  fit.fit();
  const cols = term.cols;
  const rows = term.rows;
  if (isElectron) {
    window.api.resizePty(cols, rows);
  } else {
    setupWebSocket();
    if (ws && wsReady && activeSession) {
      ws.send(JSON.stringify({ type: 'resize', id: activeSession, cols, rows }));
    }
  }
}

startBtn.addEventListener('click', async () => {
  if (!term) createTerminal();
  if (fit) fit.fit();
  const cols = term.cols;
  const rows = term.rows;
  const shell = shellSelect.value || undefined;
  
  if (isElectron) {
    const r = await window.api.createSession('manual', shell);
    if (r && r.id){ sessions.push({id:r.id,name:r.name}); activeSession = r.id; renderTabs(); }
  } else {
    setupWebSocket();
    if (!ws || !wsReady) { alert('WebSocket not ready'); return; }
    ws.send(JSON.stringify({ type: 'create', cols, rows, shell }));
  }
});

importBtn.addEventListener('click', async () => {
  if (!isElectron) { alert('Theme import not available in web mode'); return; }
  const theme = await window.api.importTheme();
  if (theme) {
    await loadThemes();
    applyTheme(theme.id || theme.name);
  }
});

exportBtn.addEventListener('click', async () => {
  if (!isElectron) { alert('Theme export not available in web mode'); return; }
  const id = themeList.value;
  const theme = themeManager.getThemeById(id);
  if (theme) await window.api.exportTheme(theme);
});

deleteBtn.addEventListener('click', async () => {
  if (!isElectron) { alert('Theme delete not available in web mode'); return; }
  const id = themeList.value;
  if (!id) return;
  const ok = await window.api.deleteTheme(id);
  if (ok && ok.ok) {
    await loadThemes();
  } else {
    alert('Could not delete theme: ' + (ok && ok.error));
  }
});

saveCfgBtn.addEventListener('click', async () => {
  const cfg = {
    glow: parseFloat(glow.value),
    scan: parseFloat(scan.value),
    blur: parseFloat(blur.value),
    aberr: parseFloat(aberr.value),
    scanSpeed: parseFloat(scanSpeed.value),
    theme: themeList.value
  };
  if (isElectron) {
    await window.api.saveConfig(cfg);
    alert('Config saved');
  } else {
    // web mode: save to localStorage
    localStorage.setItem('crt-config', JSON.stringify(cfg));
    alert('Config saved to browser');
  }
});

function bindSliders() {
  const apply = () => {
    const glowVal = parseFloat(glow.value);
    const scanVal = parseFloat(scan.value);
    const blurVal = parseFloat(blur.value);
    const aerrVal = parseFloat(aberr.value);
    const speedVal = parseFloat(scanSpeed.value);
    
    uiLog('[bindSliders] apply:', { glowVal, scanVal, blurVal, aerrVal, speedVal });
    
      if (!document || !document.documentElement) {
        uiLog('[bindSliders] document not ready');
        return;
      }
      document.documentElement.style.setProperty('--glow', glowVal);
      document.documentElement.style.setProperty('--scan-opacity', scanVal);
      document.documentElement.style.setProperty('--blur', `${blurVal}px`);
      document.documentElement.style.setProperty('--aberr', `${aerrVal}px`);
      document.documentElement.style.setProperty('--scanSpeed', speedVal);
    
      // Update animation duration dynamically via CSS variable (affects pseudo-element)
      const animDuration = (3 / (speedVal || 1)) + 's';
      document.documentElement.style.setProperty('--scan-anim-duration', animDuration);
    
      // debug output removed per user request
  };
  
  // Remove old listeners to avoid duplicates
  [glow, scan, blur, aberr, scanSpeed].forEach(el => {
    el.removeEventListener('input', el._applyHandler);
  });
  
  // Store handler reference for cleanup
  const handlers = {};
  [glow, scan, blur, aberr, scanSpeed].forEach(el => {
    el._applyHandler = apply;
    el.addEventListener('input', apply);
  });
  
  // Apply initial values
  apply();
  console.log('[bindSliders] bound and applied');
}

async function loadThemes() {
  let themes = [];
  if (isElectron) {
    themes = await window.api.getThemes();
  } else {
    // web mode: load from hard-coded default themes
    themes = [
      { id: 'default', name: 'Green Phosphor', background: '#001100', foreground: '#33ff33', accent: '#33ff33' },
      { id: 'amber', name: 'Amber', background: '#0b0a00', foreground: '#ffbf00', accent: '#ffbf00' },
      { id: 'magenta', name: 'Magenta', background: '#1a001a', foreground: '#ff66ff', accent: '#ff66ff' },
      { id: 'cyan', name: 'Cyan', background: '#000a1a', foreground: '#00d9ff', accent: '#00d9ff' },
      { id: 'white', name: 'White', background: '#0a0a0a', foreground: '#e0e0e0', accent: '#ffffff' },
      { id: 'retro-blue', name: 'Retro Blue', background: '#001050', foreground: '#6db3ff', accent: '#6db3ff' },
      { id: 'neon', name: 'Neon', background: '#0a0015', foreground: '#ff006e', accent: '#ff006e' }
    ];
  }
  
  console.log('[loadThemes] loaded', themes.length, 'themes:', themes.map(t => t.name).join(', '));
  themeManager.setThemes(themes);
  themeList.innerHTML = '';
  themes.forEach((t, idx) => {
    const opt = document.createElement('option');
    opt.value = t.id || t.name;
    opt.textContent = t.name || t.id;
    themeList.appendChild(opt);
    console.log(`  [${idx}] ${t.name} (id=${t.id})`);
  });
  console.log('[loadThemes] themeList.options.length =', themeList.options.length);
}

function applyTheme(idOrName) {
  uiLog('[applyTheme] trying to apply theme:', idOrName);
  const t = themeManager.getThemeById(idOrName) || themeManager.getThemeByName(idOrName);
  if (!t) {
    uiLog('[applyTheme] theme not found:', idOrName);
    return;
  }
  uiLog('[applyTheme] found theme:', t.name, '- bg:', t.background, 'text:', t.foreground);
  document.documentElement.style.setProperty('--bg', t.background || '#000');
  document.documentElement.style.setProperty('--text', t.foreground || '#33ff33');
  document.documentElement.style.setProperty('--accent', t.accent || '#33ff33');
}

themeList.addEventListener('change', () => {
  console.log('[themeList change] selected value:', themeList.value);
  applyTheme(themeList.value);
});

// Initialize
(async function init(){
  console.log('[init] mode:', isElectron ? 'Electron' : 'Web');
  
  // Load themes FIRST
  await loadThemes();
  console.log('[init] themes loaded');
  
  // Load saved config
  let cfg = null;
  if (isElectron) {
    cfg = await window.api.getConfig();
  } else {
    const saved = localStorage.getItem('crt-config');
    cfg = saved ? JSON.parse(saved) : null;
  }
  
  // Restore config values to sliders
  if (cfg) {
    console.log('[init] restoring config:', cfg);
    if (cfg.glow !== undefined) glow.value = cfg.glow;
    if (cfg.scan !== undefined) scan.value = cfg.scan;
    if (cfg.blur !== undefined) blur.value = cfg.blur;
    if (cfg.aberr !== undefined) aberr.value = cfg.aberr;
    if (cfg.scanSpeed !== undefined) scanSpeed.value = cfg.scanSpeed;
    if (cfg.theme) {
      themeList.value = cfg.theme;
      console.log('[init] applying theme:', cfg.theme);
      applyTheme(cfg.theme);
    }
  }
  
  // NOW bind sliders (only once, after restoring values)
  bindSliders();
  console.log('[init] sliders bound');
  
  // Setup web mode if needed
  if (!isElectron) {
    setupWebSocket();
    console.log('[init] websocket setup');
  }
  
  console.log('[init] complete');
})();

module.exports = {};
