import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // astro preview doesn't understand the Cloudflare adapter's server-mode
    // output (dist/client + dist/server); wrangler dev against the built
    // Worker's own config is the real local equivalent of production.
    // Pin loopback and the inspector endpoint. On this Windows host Wrangler's
    // random inspector proxy can lose its runtime connection before the first
    // Playwright navigation; explicit local endpoints allow the suite to run
    // against the same built Worker reliably until its separate long-process
    // instability is addressed upstream.
    command:
      "npm run build && npx wrangler dev --config dist/server/wrangler.json --ip 127.0.0.1 --port 4321 --inspector-port 9230 --show-interactive-dev-session=false --var KEYSTATIC_GITHUB_CLIENT_ID:keystatic-test-client --var KEYSTATIC_GITHUB_CLIENT_SECRET:keystatic-test-client-secret --var KEYSTATIC_SECRET:keystatic-test-session-secret-not-for-production --var PUBLIC_KEYSTATIC_GITHUB_APP_SLUG:keystatic-test-app",
    env: {
      ...process.env,
      KEYSTATIC_GITHUB_CLIENT_ID: "",
      KEYSTATIC_GITHUB_CLIENT_SECRET: "",
      KEYSTATIC_SECRET: "",
      PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: "",
    },
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
