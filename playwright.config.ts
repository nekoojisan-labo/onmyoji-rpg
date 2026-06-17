import { defineConfig, devices } from '@playwright/test';

// headless Chromium スクリーンショット検証ハーネスの土台。
// dev サーバ（vite）を webServer として起動し、テストシーンを撮影する。
export default defineConfig({
  testDir: './test-e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
