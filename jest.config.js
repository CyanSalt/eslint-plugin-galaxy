module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  modulePathIgnorePatterns: [
    '/dist/',
  ],
  testPathIgnorePatterns: [
    '/dist/',
    '/node_modules/',
  ],
  transformIgnorePatterns: [
    '/node_modules/',
  ],
  collectCoverageFrom: [
    '**/*.{js,ts}',
    // NPM ignored files
    '!**/dist/**',
    '!**/node_modules/**',
  ],
  coverageProvider: 'v8',
  coverageReporters: ['text'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.tools.json',
      isolatedModules: true,
    },
  },
  // TODO: only for NodeJS <16
  moduleNameMapper: {
    '@eslint/eslintrc/universal': '@eslint/eslintrc/dist/eslintrc-universal.cjs',
  },
}
