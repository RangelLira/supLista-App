const fs = require('fs');
const path = require('path');

// @react-native-firebase packages extend this base tsconfig that doesn't
// exist in a flat npm install (it lives in the monorepo root).
// This creates it so VS Code / tsc don't error on the missing extends.
// ignoreDeprecations:"6.0" silences the baseUrl deprecation warning
// inherited by the firebase package tsconfigs.
const target = path.join(__dirname, '..', 'node_modules', 'tsconfig.packages.base.json');
const content = JSON.stringify({ compilerOptions: { ignoreDeprecations: '6.0' } }, null, 2) + '\n';
fs.writeFileSync(target, content);
