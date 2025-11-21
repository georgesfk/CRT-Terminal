# CRT Terminal

Un terminal retro style "cool-retro-term" construit avec Electron, xterm.js et node-pty.

Caractéristiques
- Exécute un vrai shell (bash/zsh/PowerShell)
- Effets CRT : scanlines, glow, blur, chromatic aberration, vignette
- Plusieurs thèmes (Green Phosphor, Amber, Magenta)
- Panneau de configuration pour ajuster intensité, flou, vitesse des scanlines
- Responsive / mise à l'échelle
- History & scrollback (géré par xterm)
- Import / export de thèmes

Installation

1. Cloner le repository

```bash
git clone <repo> crt-terminal
cd crt-terminal
```


2. Installer les dépendances

```bash
npm install
```

Remarque importante : `node-pty` est une dépendance native et peut poser des problèmes d'installation dans des environnements limités (CI, conteneurs sans outils de build, etc.).

- Développement rapide sans `node-pty` : ce dépôt contient un fallback (stub) qui simule un PTY pour permettre le développement de l'UI et des thèmes sans module natif. Tu peux donc lancer l'application sans étapes supplémentaires, mais le shell réel ne sera pas disponible.

- Pour activer un vrai shell (recommandé sur ta machine de développement), installe `node-pty` puis reconstruis les modules natifs pour Electron :

- Pour activer un vrai shell (recommandé sur ta machine de développement), installe `node-pty` puis reconstruis les modules natifs pour Electron :

```bash
# installer node-pty (optionnellement en tant que optionalDependency)
npm install --save node-pty

# reconstruire pour la version d'Electron installée
npx electron-rebuild --force
```

Packaging (production)

```bash
# build directory (dev build)
npm run build

# create distributables (mac/windows/linux as configured)
npm run dist
```

Mode Web (test rapide dans le navigateur)

Le projet fournit aussi un petit serveur web pour tester l'UI sans Electron. Le serveur peut exposer de vrais PTY au navigateur via WebSocket si `node-pty` est installé sur le serveur.

```bash
# installer dépendances (express/ws sont déjà en devDependencies)
npm install

# (optionnel) installer node-pty pour activer un vrai shell côté serveur
npm install --save node-pty

# démarrer le serveur web
npm run web

# ouvrir http://localhost:3000 dans ton navigateur
```

Sécurité: exposer un PTY via WebSocket sur un serveur public est dangereux — ce mode est prévu uniquement pour usage local et développement.

3. Lancer l application

```bash
npm start
```

Fichiers principaux
- `main.js` : process principal Electron, gère node-pty, thèmes et config
- `preload.js` : API sécurisée exposée au renderer
- `index.html` : UI
- `src/renderer.js` : initialise xterm et gère interaction UI
- `assets/styles.css` : styles et effets CRT
- `themes/*.json` : thèmes fournis

Tests

```bash
npm test
```

Limitations
- Sur Windows/macOS/Linux, des étapes de rebuild peuvent être nécessaires pour `node-pty`.
- Build d'application : `npm run build` (utilise `electron-builder`).

Contribuer
- Ajouter des thèmes dans `themes/`.
- Ouvrir des issues pour bugs ou suggestions.
# terminal