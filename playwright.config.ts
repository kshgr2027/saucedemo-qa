import { defineConfig, devices } from '@playwright/test';

// Optional human-observation aids. Neither is used for synchronisation:
// auto-waiting and web-first assertions stay responsible for that.
//  - SLOW_MO=<ms> delays each Playwright action (default 0 = full speed).
//  - `--headed` runs open a maximized window (viewport: null); headless keeps the
//    Desktop Chrome viewport so test behaviour does not depend on screen size.
const slowMo = Number(process.env.SLOW_MO ?? 0);
// The runner sees `--headed`, but worker processes re-evaluate this file without it, so the
// flag is handed to them through the environment (workers inherit it when they are forked).
const headed = process.argv.includes('--headed') || process.env.PW_HEADED_VIEW === '1';
if (headed) process.env.PW_HEADED_VIEW = '1';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://www.saucedemo.com',
    // SauceDemo exposes stable `data-test` attributes; make getByTestId() use them.
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...(headed ? { browserName: 'chromium' as const, viewport: null } : devices['Desktop Chrome']),
        launchOptions: {
          slowMo,
          args: headed ? ['--start-maximized'] : [],
        },
      },
    },
  ],
});
