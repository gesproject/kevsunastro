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

test("desktop Shows pins through its reveal and stays singular after resize", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect.poll(() => pinCount(page, "#shows")).toBe(1);
  await page.evaluate(() => {
    const shows = document.querySelector<HTMLElement>("#shows");
    if (!shows) throw new Error("Missing #shows");
    window.scrollTo(0, shows.getBoundingClientRect().top + window.scrollY + window.innerHeight * 1.6);
  });
  await expect.poll(() => opacity(page, ".shows__header h2"), { timeout: 10_000 }).toBeGreaterThan(0.95);
  await expect.poll(() => opacity(page, ".shows__list"), { timeout: 10_000 }).toBeGreaterThan(0.95);

  // The sticky photo panel was retired with the board chrome; the section's
  // only photography is now the CSS marquee, which must exist without JS.
  await expect(page.locator(".shows__marquee-track .shows__gallery-item").first()).toBeVisible();

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(() => pinCount(page, "#shows")).toBe(1);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(() => pinCount(page, "#shows")).toBe(1);
});

test("mobile Shows enters without a pin and keeps the exit seam scroll-driven", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(".shows__header");
    if (!header) throw new Error("Missing Shows header");
    window.scrollTo(0, header.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.2);
  });
  await expect.poll(() => opacity(page, ".shows__header h2")).toBeGreaterThan(0.95);
  await expect.poll(() => opacity(page, ".shows__list")).toBeGreaterThan(0.95);
  expect(await opacity(page, "#shows")).toBe(1);
  await expect.poll(() => pinCount(page, "#shows")).toBe(0);
});

test("reduced motion leaves Shows readable without a pin or entrance state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "reduced");
  expect(await opacity(page, ".shows__header h2")).toBe(1);
  expect(await opacity(page, ".shows__list")).toBe(1);
  await expect.poll(() => pinCount(page, "#shows")).toBe(0);
});

test("the Shows anchor and keyboard paging remain usable through the desktop pin", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto("/#shows", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.evaluate(() => {
    document.documentElement.tabIndex = -1;
    document.documentElement.focus();
  });
  const before = await page.evaluate(() => window.scrollY);
  await page.keyboard.press("PageDown");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
});

test("Shows content remains available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#shows .shows__header h2")).toHaveText("Find me live.");
  await expect(page.locator("#shows .shows__list .shows__row")).toHaveCount(5);
  await expect(page.locator("#shows .shows__venue").first()).toHaveText("VELD");
  // Demo rows render no badge at all (minimalist pass): only real states —
  // Sold Out / Free / a live ticket link — earn an action cell.
  await expect(page.locator("#shows .shows__badge")).toHaveText(["Sold Out", "Sold Out", "Free"]);
  await expect(page.locator("#shows .shows__ticket")).toHaveCount(0);
  await context.close();
});
