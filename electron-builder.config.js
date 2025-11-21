const path = require('path');

module.exports = {
  appId: 'com.example.crtterminal',
  productName: 'CRT Terminal',
  directories: {
    buildResources: 'assets',
    output: 'dist'
  },
  files: [
    '**/*',
    '!**/*.map',
    '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme,HISTORY.md,HISTORY,LICENCE,LICENSE,LICENSE.md,LICENSE.txt,license.txt,LICENSEs.txt,.github,.gitignore,.gitattributes,.npmignore,.eslintrc.js,.eslintignore,eslint.config.js,*.spec.js,*.test.js,npm-debug.log*,yarn-debug.log*,yarn-error.log*,.yarn-integrity}'
  ],
  extraMetadata: {
    main: 'main.js'
  },
  win: {
    target: [
      { target: 'nsis', arch: ['x64'] },
      { target: 'portable', arch: ['x64'] }
    ]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  },
  mac: {
    target: ['dmg', 'zip'],
    category: 'public.app-category.utilities'
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Utility'
  }
};
