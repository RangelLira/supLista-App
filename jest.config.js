module.exports = {
  preset: 'react-native',
  testPathIgnorePatterns: [
    '/node_modules/',
    // Worktrees git não fazem parte da suíte principal
    '/.claude/worktrees/',
    // Fixtures são módulos de dados, não test suites
    '__tests__/fixtures/seedDatabase\\.ts$',
  ],
};
