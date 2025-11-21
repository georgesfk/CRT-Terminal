// Advanced tab management for multi-session UI
class TabManager {
  constructor(tabsEl, newTabBtn) {
    this.tabsEl = tabsEl;
    this.newTabBtn = newTabBtn;
    this.tabs = new Map();
    this.activeTab = null;
    this.renamingTab = null;
  }

  add(id, name) {
    const div = document.createElement('div');
    div.className = 'tab';
    div.dataset.id = id;
    
    const label = document.createElement('span');
    label.textContent = name || id;
    label.className = 'tab-label';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.className = 'tab-close';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.onClose && this.onClose(id);
    };
    
    div.appendChild(label);
    div.appendChild(closeBtn);
    div.onclick = () => this.select(id);
    div.oncontextmenu = (e) => {
      e.preventDefault();
      this.showContextMenu(id, e.clientX, e.clientY);
    };
    div.ondblclick = () => this.startRename(id);
    
    this.tabsEl.appendChild(div);
    this.tabs.set(id, { div, label, name });
  }

  remove(id) {
    const tab = this.tabs.get(id);
    if (tab) {
      tab.div.remove();
      this.tabs.delete(id);
      if (this.activeTab === id) this.activeTab = null;
    }
  }

  select(id) {
    this.tabs.forEach((t, tid) => {
      t.div.classList.toggle('active', tid === id);
    });
    this.activeTab = id;
    this.onSelect && this.onSelect(id);
  }

  rename(id, newName) {
    const tab = this.tabs.get(id);
    if (tab) {
      tab.name = newName;
      tab.label.textContent = newName;
      this.onRename && this.onRename(id, newName);
    }
  }

  startRename(id) {
    const tab = this.tabs.get(id);
    if (!tab) return;
    this.renamingTab = id;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tab-rename-input';
    input.value = tab.name;
    const oldLabel = tab.label;
    tab.div.replaceChild(input, tab.label);
    input.focus();
    input.select();
    input.onblur = () => {
      this.finishRename(id, input.value);
    };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') this.finishRename(id, input.value);
      if (e.key === 'Escape') this.finishRename(id, tab.name);
    };
  }

  finishRename(id, newName) {
    const tab = this.tabs.get(id);
    if (!tab) return;
    const label = document.createElement('span');
    label.textContent = newName || tab.name;
    label.className = 'tab-label';
    const input = tab.div.querySelector('input');
    if (input) tab.div.replaceChild(label, input);
    tab.label = label;
    if (newName && newName !== tab.name) {
      this.rename(id, newName);
    }
    this.renamingTab = null;
  }

  showContextMenu(id, x, y) {
    let menu = document.getElementById('contextMenu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'contextMenu';
      document.body.appendChild(menu);
    }
    menu.innerHTML = `
      <button onclick="window.tabManager.startRename('${id}')">Rename</button>
      <button onclick="window.tabManager.onClose && window.tabManager.onClose('${id}')">Close</button>
    `;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    document.body.style.setProperty('--context-menu-open', 'block');
    setTimeout(() => {
      document.addEventListener('click', () => {
        document.body.style.setProperty('--context-menu-open', 'none');
      }, { once: true });
    }, 10);
  }
}

window.TabManager = TabManager;
