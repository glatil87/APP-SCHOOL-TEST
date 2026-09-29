import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  // Files run in name order: 1-joining creates the coordinator later files use.
  fullyParallel: false,
  expect: { timeout: 10_000 },
  globalSetup: "./e2e/global-setup.ts",
  // The flows build on each other (setup → invite → join → approve).
  workers: 1,
  use: { baseURL: "http://localhost:3100" },
  projects: [{ name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } }],
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
