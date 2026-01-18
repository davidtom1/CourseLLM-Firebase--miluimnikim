const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

const customJestConfig = {
  // CRITICAL: This ensures our mocks load before any test runs
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Clear mocks between tests to prevent pollution
  clearMocks: true,
  // Exclude Playwright E2E tests - they should only run via `npm run test:e2e`
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/tests/',         // Playwright E2E tests folder
    '\\.spec\\.ts$',            // Playwright convention: .spec.ts
  ],
  // Only run .test.ts/.test.tsx files (Jest convention)
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(test).[jt]s?(x)',
  ],
}

module.exports = createJestConfig(customJestConfig)
