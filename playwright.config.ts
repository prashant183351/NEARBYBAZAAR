/**
 * Playwright configuration for NearbyBazaar E2E smoke tests.
 * Tests the web, vendor, and admin PWAs with headless Chromium.
 * 
 * Run locally: pnpm test:e2e (requires dev servers running)
 * Run in CI: Will start servers via webServer config or external setup.
 * 
 * Feature #157: Playwright Smoke Tests
 */

import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const baseURL = process.env.BASE_URL || 'http://localhost:3001';

export default defineConfig({
  testDir: './tests/e2e',
  
  // Timeout for each test
  timeout: 30_000,
  
  // Global setup/teardown files (optional)
  // globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  // globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
  
  // Fail fast in CI
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  
  // Reporter config
  reporter: isCI ? 'github' : 'html',
  
  use: {
    // Base URL for navigation
    baseURL,
    
    // Collect trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },

  // Test against different browsers/viewports as separate projects
  projects: [
    {
      name: 'web-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001',
      },
      testMatch: /.*web\.spec\.ts/,
    },
    {
      name: 'vendor-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3002',
      },
      testMatch: /.*vendor\.spec\.ts/,
    },
    {
      name: 'admin-chromium',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
      },
      testMatch: /.*admin\.spec\.ts/,
    },
    
    // Optional: Mobile viewports for PWA testing
    // {
    //   name: 'web-mobile',
    //   use: { 
    //     ...devices['Pixel 5'],
    //     baseURL: 'http://localhost:3001',
    //   },
    //   testMatch: /.*web\.spec\.ts/,
    // },
  ],

  // Optionally start dev servers before tests (comment out if starting manually)
  // webServer: [
  //   {
  //     command: 'pnpm --filter @nearbybazaar/web dev',
  //     port: 3001,
  //     timeout: 120_000,
  //     reuseExistingServer: !isCI,
  //   },
  //   {
  //     command: 'pnpm --filter @nearbybazaar/vendor dev',
  //     port: 3002,
  //     timeout: 120_000,
  //     reuseExistingServer: !isCI,
  //   },
  //   {
  //     command: 'pnpm --filter @nearbybazaar/admin dev',
  //     port: 3003,
  //     timeout: 120_000,
  //     reuseExistingServer: !isCI,
  //   },
  // ],
});
