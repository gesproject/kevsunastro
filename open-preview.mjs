import { chromium } from "@playwright/test";

const urls = [
  "https://9b3b6305-solbo-astro7-cloudflare.nickgagne92.workers.dev/",
  "https://9b3b6305-solbo-astro7-cloudflare.nickgagne92.workers.dev/link/",
];

const browser = await chromium.launch({ headless: false, args: ["--start-maximized"] });
const context = await browser.newContext({ viewport: null });

for (const url of urls) {
  const page = await context.newPage();
  await page.goto(url);
}

// Keep the process (and browser) alive until this script is killed.
await new Promise(() => {});
