import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173/places/',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // On Arch Linux, using the system browser is often more stable
        launchOptions: {
          executablePath: '/usr/bin/chromium',
        },
      },
    },
  ],

  // Run the dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173/places/',
    reuseExistingServer: !process.env.CI,
  },
});
