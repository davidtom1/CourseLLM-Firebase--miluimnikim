import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * IMPORTANT: This file MUST be at the project root for Playwright to find it.
 * Test files are in tests/e2e/ and must use .spec.ts extension.
 */
export default defineConfig({
  // Test directory - contains E2E specs
  testDir: './tests',

  // CRITICAL: Only match .spec.ts files (Playwright convention)
  // This prevents Playwright from picking up Jest .test.tsx files
  testMatch: '**/*.spec.ts',

  // Explicitly ignore Jest test patterns and source directories
  testIgnore: [
    '**/__tests__/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/node_modules/**',
    '**/src/**',
  ],

  // Timeouts
  timeout: 120_000,
  expect: { timeout: 10_000 },

  // Run tests sequentially for stability
  fullyParallel: false,
  workers: 1, // Force single worker to prevent emulator resource contention

  // Fail fast in CI
  forbidOnly: !!process.env.CI,

  // Retry failed tests
  retries: process.env.CI ? 2 : 0,

  // Reporter
  reporter: process.env.CI ? 'github' : 'html',

  // Shared settings for all projects
  use: {
    baseURL: 'http://localhost:9002',
    headless: false,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,

    // Capture artifacts on failure
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    port: 9002,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

