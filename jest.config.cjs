/**
 * Jest Configuration for safemocker
 *
 * Handles ESM modules (next-safe-action) by mocking them at the package level
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2022',
          module: 'commonjs',
          moduleResolution: 'node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
  ],
  // Mock ESM modules that Jest can't handle
  moduleNameMapper: {
    // Map next-safe-action to our mock (when __mocks__ exists)
    '^next-safe-action$': '<rootDir>/__mocks__/next-safe-action.ts',
  },
  // Transform next-safe-action package (if needed)
  transformIgnorePatterns: [
    'node_modules/(?!(next-safe-action)/)',
  ],
};

