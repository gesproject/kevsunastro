import { expect, test } from "@playwright/test";

const HOME = "/";

function blockHeroFrames(page: import("@playwright/test").Page) {
  return page.route("**/hero-frames/**", (route) => route.abort());
}

function scrollIntoView(page: import("@playwright/test").Page, selector: string) {
  return page.evaluate((target) => {
    const element = document.querySelector<HTMLElement>(target);
    if (!element) throw new Error(`Missing ${target}`);
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.2);
  }, selector);
}

function opacity(page: import("@playwright/test").Page, selector: string) {
  return page.locator(selector).evaluate((element) => Number(getComputedStyle(element).opacity));
}

function pinCount(page: import("@playwright/test").Page, selector: string) {
  return page.evaluate((target) => {
    const section = document.querySelector(target);
    return section?.parentElement?.classList.contains("pin-spacer") ? 1 : 0;
  }, selector);
}

test("desktop Music pins for its 120% reveal and stays singular after resize", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto(HOME, { waitUntil: "domcontentloaded" });

  await expect.poll(() => pinCount(page, "#music")).toBe(1);

  await page.evaluate(() => {
    const music = document.querySelector<HTMLElement>("#music");
    if (!music) throw new Error("Missing #music");
    window.scrollTo(0, music.getBoundingClientRect().top + window.scrollY + window.innerHeight * 1.2);
  });
  await expect.poll(() => opacity(page, ".music__stack"), { timeout: 10_000 }).toBeGreaterThan(0.95);
  await expect.poll(() => opacity(page, ".music__heading"), { timeout: 10_000 }).toBeGreaterThan(0.95);

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(() => pinCount(page, "#music")).toBe(1);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(() => pinCount(page, "#music")).toBe(1);
});

test("mobile enters without a pin and reveals its player card", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await blockHeroFrames(page);
  await page.goto(HOME, { waitUntil: "domcontentloaded" });

  await scrollIntoView(page, ".music__stack");
  await expect.poll(() => opacity(page, ".music__stack")).toBeGreaterThan(0.95);
  await expect.poll(() => pinCount(page, "#music")).toBe(0);
});

test("reduced motion leaves Music readable without a pin or entrance state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await blockHeroFrames(page);
  await page.goto(HOME, { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "reduced");
  expect(await opacity(page, ".music__stack")).toBe(1);
  expect(await opacity(page, ".music__heading")).toBe(1);
  await expect.poll(() => pinCount(page, "#music")).toBe(0);
});

test("the Music anchor and keyboard paging remain usable through the desktop pin", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto("/#music", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.evaluate(() => {
    document.documentElement.tabIndex = -1;
    document.documentElement.focus();
  });
  const before = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});
