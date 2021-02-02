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
    'packages/**/*.{js,ts}',
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
}
