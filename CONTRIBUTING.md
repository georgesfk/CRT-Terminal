# CONTRIBUTING.md

Bienvenue ! Voici comment contribuer au projet CRT Terminal.

## Setup développement

```bash
git clone <repo>
cd crt-terminal
npm install
npm install --save node-pty       # pour un vrai shell
npx electron-rebuild --force      # rebuild node-pty pour Electron
npm start
```

## Structure des contributions

### Ajouter un thème

1. Crée `themes/mon-theme.json` :

```json
{
  "id": "mon-theme",
  "name": "Mon Thème",
  "background": "#0a0a0a",
  "foreground": "#00ff00",
  "accent": "#ffff00",
  "description": "Description courte"
}
```

2. Redémarre l'app — ton thème apparaît dans le dropdown Theme.
3. Propose un PR avec le fichier.

### Améliorer les effets CRT

Édite `assets/styles.css` :

- `--glow`: intensité du bloom (0-2)
- `--scan-opacity`: opacité des scanlines (0-1)
- `--blur`: flou en pixels (0-6px)
- `--aberr`: aberration chromatique (0-8px)
- `--scanSpeed`: vitesse d'animation des scanlines

Les changements CSS s'appliquent en temps réel dans le panneau de config.

### Ajouter une fonctionnalité

1. Décris-la dans une issue (discussion).
2. Crée une branche feature (`git checkout -b feature/my-feature`).
3. Implémente-la.
4. Ajoute des tests si pertinent (`test/*.test.js`).
5. Lance `npm test` pour vérifier.
6. Propose un PR.

### Tests

```bash
npm test
```

Ajoute des tests pour les nouveaux modules dans `test/`.

Exemple (`test/myModule.test.js`) :

```javascript
const myModule = require('../src/myModule');

describe('myModule', () => {
  test('does something', () => {
    expect(myModule.something()).toBe(true);
  });
});
```

## Code Style

- JavaScript vanilla (pas de build tool pour le renderer)
- Indentation: 2 espaces
- Nommage: camelCase pour les variables/fonctions
- Commentaires en français ou anglais (cohérent)

## Commits

Utilise des messages clairs :

```
feat: add cyan theme
fix: correct tab renaming bug
docs: update README with web mode instructions
refactor: simplify theme loading
test: add themeManager tests
```

## Pull Requests

1. Branche à jour avec `main`
2. Description claire : que change, pourquoi ?
3. Tests passants (`npm test`)
4. Pas d'erreurs lint/build

Merci pour ta contribution ! 🎨
