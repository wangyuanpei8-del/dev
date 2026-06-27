import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** 仅当显式设置 PW_TEST_AUTO_SERVER=1 时自动启动 dev（CI 或未手动起服时用） */
const autoServer = process.env.PW_TEST_AUTO_SERVER === '1' || process.env.CI === 'true';

const webServer = autoServer
  ? [
      {
        command: 'npm run dev --prefix apps/api',
        cwd: rootDir,
        url: 'http://127.0.0.1:3001/api/v1/health',
        reuseExistingServer: true,
        timeout: 120_000,
      },
      {
        command: 'npm run dev --prefix apps/web',
        cwd: rootDir,
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
    ]
  : undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 30_000,
  reporter: process.env.CI ? 'github' : 'line',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    locale: 'ja-JP',
    actionTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(webServer ? { webServer } : {}),
});
