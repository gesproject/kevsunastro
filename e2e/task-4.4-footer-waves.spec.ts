import { expect, test } from "@playwright/test";

function blockHeroFrames(page: import("@playwright/test").Page) {
  return page.route("**/hero-frames/**", (route) => route.abort());
}

const strokes = {
  install: (page: import("@playwright/test").Page) =>
    page.addInitScript(() => {
      const target = window as unknown as { __footerWaveStrokes: number };
      target.__footerWaveStrokes = 0;
      const stroke = CanvasRenderingContext2D.prototype.stroke;
      CanvasRenderingContext2D.prototype.stroke = function (this: CanvasRenderingContext2D, ...args) {
        if ((this.canvas as HTMLElement).hasAttribute("data-footer-waves")) target.__footerWaveStrokes += 1;
        return stroke.apply(this, args as never);
      };
    }),
  read: (page: import("@playwright/test").Page) => page.evaluate(() => (window as unknown as { __footerWaveStrokes: number }).__footerWaveStrokes),
};

function stubIntersectionObserver(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    function FakeIO(this: IntersectionObserver, callback: IntersectionObserverCallback) {
      this.observe = (target: Element) => {
        if ((target as HTMLElement).hasAttribute("data-footer-waves")) {
          (window as unknown as { __setFooterWavesVisible: (visible: boolean) => void }).__setFooterWavesVisible = (visible: boolean) => {
            callback([{ isIntersecting: visible, target } as IntersectionObserverEntry], this);
          };
        }
        callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
      };
      this.unobserve = () => {};
      this.disconnect = () => {};
    }
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;
  });
}

function setVisible(page: import("@playwright/test").Page, visible: boolean) {
  return page.evaluate((next) => (window as unknown as { __setFooterWavesVisible?: (value: boolean) => void }).__setFooterWavesVisible?.(next), visible);
}

async function hideTab(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

test("Footer's canvas simplex field paints and animates", async ({ page }) => {
  await strokes.install(page);
  await stubIntersectionObserver(page);
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const canvas = page.locator("canvas[data-footer-waves]");
  await expect(canvas).toHaveAttribute("data-ready", "");
  const first = await strokes.read(page);
  await expect.poll(() => strokes.read(page)).toBeGreaterThan(first);
});

test("Footer waves pause while off-screen and resume on return", async ({ page }) => {
  await strokes.install(page);
  await stubIntersectionObserver(page);
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("canvas[data-footer-waves]")).toHaveAttribute("data-ready", "");
  await expect.poll(() => strokes.read(page)).toBeGreaterThan(0);
  await setVisible(page, false);
  const paused = await strokes.read(page);
  await page.waitForTimeout(400);
  expect(await strokes.read(page)).toBe(paused);
  await setVisible(page, true);
  await expect.poll(() => strokes.read(page)).toBeGreaterThan(paused);
});

test("a hidden tab pauses Footer waves", async ({ page }) => {
  await strokes.install(page);
  await stubIntersectionObserver(page);
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("canvas[data-footer-waves]")).toHaveAttribute("data-ready", "");
  await hideTab(page);
  const paused = await strokes.read(page);
  await page.waitForTimeout(400);
  expect(await strokes.read(page)).toBe(paused);
});

test("reduced motion paints Footer waves once without a loop", async ({ page }) => {
  await strokes.install(page);
  await stubIntersectionObserver(page);
  await blockHeroFrames(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("canvas[data-footer-waves]")).toHaveAttribute("data-ready", "");
  await page.waitForTimeout(300);
  const staticStrokes = await strokes.read(page);
  expect(staticStrokes).toBeGreaterThan(0);
  await page.waitForTimeout(400);
  expect(await strokes.read(page)).toBe(staticStrokes);
});

test("Footer stays readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#footer .footer__booking")).toContainText("Booking / Inquiries");
  await expect(page.locator(".footer__waves canvas")).toHaveCount(0);
  await context.close();
});
