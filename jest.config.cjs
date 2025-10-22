/** @type {import('jest').Config} */
module.exports = {
  projects: [
    '<rootDir>/packages/lib',
    '<rootDir>/apps/api',
    '<rootDir>/apps/web',
    '<rootDir>/apps/vendor',
    '<rootDir>/apps/admin',
    '<rootDir>/packages/ui',
    '<rootDir>/packages/types',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 65,
    },
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/e2e/',
    '/tests/formRenderer.spec.ts',
  ],
  testTimeout: 30000,
  reporters: ['default'],
};
