/** @type {import('jest').Config} */
module.exports = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
  // Skip heavy integration suites (Mongo/Redis dependent) by default to keep fast unit runs green.
  // Opt-in to full integration tests by setting RUN_INTEGRATION=true when running Jest.
  testPathIgnorePatterns:
    process.env.RUN_INTEGRATION === 'true'
      ? []
      : [
          '<rootDir>/tests/dropship.spec.ts',
          '<rootDir>/tests/notifications.test.ts',
          '<rootDir>/tests/compliance.test.ts',
          '<rootDir>/tests/vendor.slug.spec.ts',
          '<rootDir>/tests/sitemap.spec.ts',
          '<rootDir>/tests/seo.spec.ts',
          '<rootDir>/tests/rateLimiter.spec.ts',
          '<rootDir>/tests/plan.test.ts',
          '<rootDir>/tests/kaizen.spec.ts',
          '<rootDir>/tests/slugHistory.spec.ts',
          '<rootDir>/tests/erpAdapters.spec.ts',
          '<rootDir>/tests/watermark.spec.ts',
          '<rootDir>/tests/immutableAudit.spec.ts',
        ],
  moduleNameMapper: {
    '^@nearbybazaar/lib$': '<rootDir>/../../packages/lib/src/index.ts',
    '^@nearbybazaar/lib/src/(.*)$': '<rootDir>/../../packages/lib/src/$1',
    '^@nearbybazaar/lib/(.*)$': '<rootDir>/../../packages/lib/src/$1',
    '^@nearbybazaar/lib/slug$': '<rootDir>/../../packages/lib/src/slug.ts',
    '^@nearbybazaar/lib/sku$': '<rootDir>/../../packages/lib/src/sku.ts',
    '^sharp$': '<rootDir>/tests/__mocks__/sharp.ts',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^../../models/AdCampaign$': '<rootDir>/src/models/AdCampaign.ts',
    '^../../services/adAuction$': '<rootDir>/src/services/adAuction.ts',
    '^../../services/adTracking$': '<rootDir>/src/services/adTracking.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        diagnostics: { warnOnly: true },
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts', '!src/server.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 80,
      statements: 80,
    },
    './src/services/dropship/': {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
