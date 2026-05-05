import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.resolve(repoRoot, ".env") });
dotenv.config({ path: path.resolve(repoRoot, "apps/api/.env"), override: false });
dotenv.config({ path: path.resolve(__dirname, ".env"), override: false });

const testDatabaseUrl = process.env.E2E_DATABASE_URL ?? process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    "Playwright e2e requires TEST_DATABASE_URL or E2E_DATABASE_URL so it never runs against the real database.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm --workspace apps/api run dev",
      cwd: repoRoot,
      url: "http://localhost:3001",
      timeout: 120 * 1000,
      reuseExistingServer: false,
      env: {
        NODE_ENV: "test",
        TEST_DATABASE_URL: testDatabaseUrl,
        DATABASE_URL: testDatabaseUrl,
      },
    },
    {
      command: "npm --workspace apps/web run dev -- --port 4173 --strictPort",
      cwd: repoRoot,
      url: "http://localhost:4173",
      timeout: 120 * 1000,
      reuseExistingServer: false,
      env: {
        VITE_API_URL: "http://localhost:3001",
      },
    },
  ],
});
