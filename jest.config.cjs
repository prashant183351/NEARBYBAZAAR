/* Root Jest configuration for the NearbyBazaar monorepo.
 * This aggregates project-level configs so a single `pnpm test` runs tests across workspaces.
 * Each project can keep its own jest.config.js for specific settings (transform, env, mappers).
 *
 * Note: We intentionally include only packages/apps that currently have Jest configs and tests.
 */

/** @type {import('jest').Config} */
// Renamed to .cjs for CommonJS compatibility with Jest
module.exports = {
  // Run each workspace as its own project so their local configs apply
  projects: [
    '<rootDir>/packages/lib',
    '<rootDir>/apps/api',
    '<rootDir>/apps/web',
    '<rootDir>/apps/vendor',
    '<rootDir>/apps/admin',
    '<rootDir>/packages/ui',
    '<rootDir>/packages/types',
  ],

  // Global coverage threshold (projects can override/raise theirs)


  // Keep root fairly simple; defer transforms and module mappings to project configs
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testTimeout: 30000,
  reporters: ['default'],
};

