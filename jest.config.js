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
  transform: {
    '^.+\\.[jt]s$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.test.json',
        isolatedModules: true,
      },
    ],
  },
}
