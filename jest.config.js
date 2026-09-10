module.exports = {
  preset: 'react-native',
  // Jest concatena os setupFiles do preset (RN) com estes.
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  // App.test.tsx monta a árvore inteira (providers + boot assíncrono); na
  // primeira execução sem cache o transform sozinho pode passar de 5s.
  testTimeout: 30000,
};
