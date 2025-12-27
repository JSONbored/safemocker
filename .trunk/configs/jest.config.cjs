/**
 * Jest Configuration for Safemocker
 *
 * Moved to .trunk/configs/ for Trunk integration
 *
 * Test files should be co-located with source files using *.test.ts naming.
 * Example: adapter.ts → adapter.test.ts (same directory)
 */

module.exports = {
  // CRITICAL: Set rootDir to project root (not .trunk/configs/)
  // This ensures all path mappings work correctly
  rootDir: '../..',
  
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
  // Use v8 coverage provider instead of babel-plugin-istanbul to avoid instrumentation conflicts
  // v8 is faster and works better with ts-jest
  coverageProvider: 'v8',
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
  
  // JUnit XML reporter for Trunk Flaky Tests integration
  // Outputs test results in JUnit XML format for Trunk cloud analysis
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '../../.trunk/test-results/jest',
        outputName: 'junit.xml',
        addFileAttribute: 'true',
        reportTestSuiteErrors: 'true',
        suiteName: 'Jest Tests',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
      },
    ],
  ],
};

