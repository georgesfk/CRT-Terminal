# CRT Terminal

Un terminal retro style "cool-retro-term" avec effets CRT authentiques, construit avec Electron, xterm.js et node-pty.

![CRT Terminal Features](docs/features.md)

## Caractéristiques principales

✨ **Effets CRT authentiques**
- Scanlines animées (opacité et vitesse ajustables)
- Glow/bloom avec intensité configurable
- Aberration chromatique
- Flou (blur) pour l'effet CRT classique
- Vignette

🎨 **Système de thèmes**
- 7 thèmes intégrés : Green Phosphor, Amber, Magenta, Cyan, White, Retro Blue, Neon
- Import/export de thèmes personnalisés (JSON)
- Changement de thème en temps réel
- CSS variables pour personnalisation facile

🔗 **Multi-sessions (Onglets)**
- Créer, basculer, fermer des sessions de terminal
- Renommer les onglets (double-clic ou contexte menu)
- Gestion des sessions persistante via electron-store

⚙️ **Panneau de configuration**
- Contrôle en temps réel des effets CRT
- Curseurs pour glow, scanlines, blur, aberration, vitesse
- Configuration sauvegardée automatiquement

🌐 **Mode Web**
- Serveur Express + WebSocket (pas besoin d'Electron)
- Testez l'UI dans le navigateur
- Support optionnel du vrai PTY via node-pty

🚀 **Cross-platform**
- Electron pour Windows, macOS, Linux
- Electron-builder pour packaging (installateurs, DMG, AppImage, etc.)

## Installation rapide

```bash
# 1. Cloner et installer
git clone <repo> crt-terminal
cd crt-terminal
npm install

# 2. Mode développement simple (sans vrai shell, stub PTY)
npm start

# Ou mode Web (navigateur)
npm run web
# Ouvrir http://localhost:3000
```

## Installation avec shell réel (node-pty)

Si tu veux un vrai shell bash/zsh/PowerShell (recommandé pour usage serious) :

```bash
# 1. Installer node-pty
npm install --save node-pty

# 2. Reconstruire pour Electron
npx electron-rebuild --force

# 3. Lancer
npm start
```

⚠️ `node-pty` est un module natif. Sur certains systèmes, `electron-rebuild` peut échouer si les outils de compilation C++ manquent. Voir [Troubleshooting](#troubleshooting).

## Utilisation

### Electron (mode Bureau)

```bash
npm start
```

- Crée des onglets : bouton `＋` dans la barre d'onglets
- Configure les effets : panneau à droite (glow, scanlines, blur, etc.)
- Change de thème : dropdown "Theme" dans le panneau
- Renomme les onglets : double-clic sur un onglet
- Contexte menu : clic droit sur un onglet → Rename/Close
- Importe/exporte des thèmes : boutons en haut à droite

### Mode Web

```bash
npm install express ws  # si nécessaire
npm run web
```

Ouvre http://localhost:3000. La même UI fonctionne mais le PTY est stub (echo) sauf si `node-pty` est installé sur le serveur.

### Configuration et thèmes

Les paramètres sont sauvegardés dans :
- **Electron**: `~/.config/crt-terminal/` (Linux), `~/Library/Application Support/crt-terminal/` (macOS), etc.
- **Web**: localStorage du navigateur (non persistant entre changements)

Les thèmes sont des fichiers JSON dans `themes/` :

```json
{
  "id": "custom",
  "name": "My Theme",
  "background": "#001100",
  "foreground": "#33ff33",
  "accent": "#00ff00"
}
```

Importe via le bouton UI ou place dans `themes/*.json`.

## Fichiers importants

```
.
├── main.js                     # Electron main process
├── preload.js                  # Secure context bridge
├── index.html                  # UI markup
├── src/
│   ├── renderer.js             # Terminal UI logic + xterm init
│   ├── themeManager.js         # Theme utilities
│   ├── sessionManager.js       # Session persistence
│   └── tabManager.js           # Advanced tab UI
├── assets/
│   ├── styles.css              # CRT effects + layout
│   └── tabs-advanced.css       # Tab styling
├── tools/
│   └── web-server.js           # Express + WebSocket backend
├── themes/                     # Theme JSON files
│   ├── default.json
│   ├── amber.json
│   ├── magenta.json
│   ├── cyan.json
│   ├── white.json
│   ├── retro-blue.json
│   └── neon.json
├── test/                       # Jest unit tests
├── electron-builder.config.js  # Packaging config
├── package.json
└── README.md
```

## Scripts npm

```bash
npm start                # Lancer l'app Electron
npm run web             # Démarrer le serveur web (express)
npm run build           # Build de développement
npm run dist            # Créer les distributables (packaging)
npm test                # Exécuter les tests Jest
```

## Tests

```bash
npm test
```

Exécute les tests unitaires (Jest). Actuellement : test du themeManager.

## Packaging (Production)

```bash
npm run dist
```

Crée les installateurs pour ta plateforme :
- **Windows**: NSIS installer + portable EXE
- **macOS**: DMG + ZIP
- **Linux**: AppImage + DEB

Configure les cibles et les icônes dans `electron-builder.config.js`.

## Troubleshooting

### `electron-rebuild` échoue

Si tu vois une erreur lors de `npx electron-rebuild --force` :

1. **Windows**: Installe Visual Studio Build Tools (C++ compiler)
2. **macOS**: Installe Xcode CLI (`xcode-select --install`)
3. **Linux**: Installe build-essential (`sudo apt install build-essential python3`)

Sinon, lance simplement sans `node-pty` et utilise le stub PTY.

### Port 3000 déjà utilisé (mode web)

```bash
# Tue le processus sur le port 3000
lsof -i :3000 | grep -v COMMAND | awk '{print $2}' | xargs kill -9

# Ou utilise un autre port
PORT=3001 npm run web
```

### Les thèmes ne s'appliquent pas

- Assure-toi que le fichier JSON est valide (`themes/*.json`)
- Redémarre l'app après avoir ajouté un thème
- Vérifie les couleurs CSS hex valides (p.ex., `#33ff33`)

## Architecture

```
Electron Process (main.js)
  ├─ Window creation
  ├─ node-pty spawning (fallback to stub if missing)
  ├─ Session management (create/switch/close)
  ├─ Theme/Config I/O (electron-store)
  └─ IPC handlers for: pty-start, pty-write, pty-resize, session-*, get-themes, save-config, etc.

Preload (preload.js)
  └─ Secure context bridge: window.api.{startPty, writePty, createSession, getThemes, ...}

Renderer (index.html + src/renderer.js)
  ├─ xterm.js + FitAddon for terminal display
  ├─ WebSocket fallback for web mode
  ├─ Tab manager (tabManager.js) for UI
  ├─ Theme manager (themeManager.js) for color schemes
  └─ Interactive sliders for CRT effect parameters

Web Mode (tools/web-server.js)
  ├─ Express server on :3000
  ├─ Static file serving (renderer HTML/CSS/JS)
  └─ WebSocket connections for PTY (real or stub)
```

## Configuration avancée

### Electron-builder

Édite `electron-builder.config.js` pour :
- Changer l'appId, productName
- Ajouter des icônes (assets)
- Configurer les cibles de build (win, mac, linux)
- Signer les applications

### Thèmes personnalisés

Ajoute un fichier `themes/my-theme.json` :

```json
{
  "id": "my-theme",
  "name": "My Custom CRT",
  "background": "#0a0a0a",
  "foreground": "#00ff00",
  "accent": "#ffff00",
  "description": "Green text on black, with yellow accent"
}
```

Redémarre l'app, le thème apparaîtra dans le dropdown.

### Mode Web avec node-pty réel

Installe `node-pty` sur le serveur :

```bash
npm install --save node-pty
npm run web
```

Le serveur WebSocket créera de vrais PTY pour chaque connexion. ⚠️ **Attention**: exposer un shell via WebSocket est risqué. Utilise-le seulement en local.

## Contribuer

- Ajoute des thèmes dans `themes/`
- Ouvre des issues pour bugs/suggestions
- Pull requests bienvenues

## Licence

MIT

## Auteur

Généré par GitHub Copilot (2025)

---

**Enjoy your retro CRT terminal! 🚀**
