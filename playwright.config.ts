import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 60000, workers: 1,
  webServer: [
    { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
    { command: 'npm run build && npm run preview', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 900 },
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined), args: ['--enable-webgl', '--ignore-gpu-blocklist'] },
  },
  reporter: 'list',
});
