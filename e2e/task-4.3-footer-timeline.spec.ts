import { expect, test } from "@playwright/test";

function blockHeroFrames(page: import("@playwright/test").Page) {
  return page.route("**/hero-frames/**", (route) => route.abort());
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

function enterFooter(page: import("@playwright/test").Page, offset = 0.75) {
  return page.evaluate((viewportOffset) => {
    const footer = document.querySelector<HTMLElement>("#footer");
    if (!footer) throw new Error("Missing Footer");
    window.scrollTo(0, footer.getBoundingClientRect().top + window.scrollY - window.innerHeight * viewportOffset);
  }, offset);
}

test("desktop Footer reveals booking then links without pinning", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await enterFooter(page);
  await expect.poll(() => opacity(page, ".footer__booking"), { timeout: 10_000 }).toBeGreaterThan(0.95);
  await expect.poll(() => opacity(page, ".footer__links a:first-child"), { timeout: 10_000 }).toBeGreaterThan(0.95);
  expect(await pinCount(page, "#footer")).toBe(0);

  await page.setViewportSize({ width: 768, height: 1024 });
  await enterFooter(page, 0);
  expect(await pinCount(page, "#footer")).toBe(0);
});

test("mobile Footer scrubs content in without a pin", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await enterFooter(page, 0.2);
  await expect.poll(() => opacity(page, ".footer__content")).toBeGreaterThan(0.95);
  expect(await pinCount(page, "#footer")).toBe(0);
});

test("reduced motion leaves Footer readable without an entrance state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "reduced");
  expect(await opacity(page, ".footer__content")).toBe(1);
  expect(await pinCount(page, "#footer")).toBe(0);
});

test("the Footer anchor and keyboard paging remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto("/#footer", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.evaluate(() => {
    document.documentElement.tabIndex = -1;
    document.documentElement.focus();
  });
  const before = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("PageUp");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(before);
});

test("Footer content remains available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#footer .footer__booking")).toContainText("Booking / Inquiries");
  await expect(page.locator("#footer .footer__links")).toContainText("Instagram");
  await context.close();
});
