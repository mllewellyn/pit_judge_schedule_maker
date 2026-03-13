/**
 * Playwright config for screenshot generation (help section images).
 *
 * Uses a separate dev-server port (5176) so it never conflicts with the
 * main E2E test server (5175).  Run via:  npm run screenshots
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/screenshots.spec.js',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',

  use: {
    baseURL: 'http://localhost:5176/pit_judge_schedule_maker/',
    // Screenshots are the output — disable failure screenshots to avoid noise.
    screenshot: 'off',
    trace: 'off',
    // Disable CSS / JS animations so frames are fully settled.
    launchOptions: { args: ['--force-prefers-reduced-motion'] },
  },

  projects: [
    {
      name: 'screenshots',
      // Mobile viewport matching iPhone 13 dimensions.
      // Uses Chromium (always installed) rather than a device preset so no
      // additional browser download is required.
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],

  webServer: {
    command: 'VITE_MOCK_MODE=true npx vite --port 5176',
    url: 'http://localhost:5176/pit_judge_schedule_maker/',
    reuseExistingServer: true,
    timeout: 30000,
  },
})
