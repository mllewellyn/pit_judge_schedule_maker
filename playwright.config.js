import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 15000,
  expect: { timeout: 5000 },
  fullyParallel: false, // tests share a server; run sequentially to avoid localStorage collisions
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:5175/pit_judge_schedule_maker/',
    // Capture trace/screenshot on failure for debugging
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewport — judges use phones in the pits
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'VITE_MOCK_MODE=true npx vite --port 5175',
    url: 'http://localhost:5175/pit_judge_schedule_maker/',
    // Always reuse an existing server if one is already on the port.
    // In CI the workflow kills old processes between jobs so this is safe.
    reuseExistingServer: true,
    timeout: 30000,
  },
})
