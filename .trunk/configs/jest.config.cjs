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
  // Use v8 coverage provider - babel conflicts with ts-jest
  // For 100% coverage, we restructure simple return statements to be more trackable
  coverageProvider: 'v8',
  // Ensure all lines are instrumented, including simple return statements
  coveragePathIgnorePatterns: [],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Barrel export file
    '!src/jest-adapter.ts', // Barrel export file
    '!src/vitest-adapter.ts', // Barrel export file
    '!src/types.ts', // Type definitions only
  ],
  // Set coverage threshold to 98% (accounting for v8 provider limitations with simple return statements)
  // v8 coverage provider has known limitations tracking simple return statements in optimized code
  // Lines 147-150 (outputSchema return) and 209-211 (error return) in client.ts are executed
  // but not tracked by v8 coverage provider - this is a tooling limitation, not a code issue
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 94,
      lines: 98,
      statements: 98,
    },
    // client.ts has known v8 coverage limitations with simple return statements
    './src/client.ts': {
      branches: 96,
      functions: 94,
      lines: 95,
      statements: 95,
    },
  },
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

