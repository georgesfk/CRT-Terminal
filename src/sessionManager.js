const Store = require('electron-store');
const store = new Store({ name: 'crt-terminal' });

// Get all persisted sessions
function getSessions() {
  return store.get('sessions', []);
}

// Save a session
function saveSession(session) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  store.set('sessions', sessions);
}

// Delete a session
function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id);
  store.set('sessions', sessions);
}

// Rename a session
function renameSession(id, name) {
  const sessions = getSessions();
  const s = sessions.find(s => s.id === id);
  if (s) {
    s.name = name;
    store.set('sessions', sessions);
    return true;
  }
  return false;
}

module.exports = {
  getSessions,
  saveSession,
  deleteSession,
  renameSession
};
