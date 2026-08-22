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

test("desktop Footer keeps its full wordmark and contact rail inside the expanded field", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const layout = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
    const footer = box("#footer");
    const wordmark = box(".footer__watermark--desktop span");
    const email = box(".footer__booking-email");
    const socialLink = box(".footer__links a");
    return { footerHeight: footer.height, wordmarkRight: wordmark.right, emailRight: email.right, emailTop: email.top, socialRight: socialLink.right, socialTop: socialLink.top };
  });

  expect(layout.footerHeight).toBeGreaterThanOrEqual(900 * 0.75);
  expect(layout.wordmarkRight).toBeLessThanOrEqual(1440);
  expect(Math.abs(layout.emailRight - layout.socialRight)).toBeLessThan(1);
  expect(layout.socialTop).toBeGreaterThan(layout.emailTop);
});

test("mobile Footer keeps its contact rail inside the expanded field", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const layout = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
    const footer = box("#footer");
    const email = box(".footer__booking-email");
    const socialLink = box(".footer__links a");
    return { footerHeight: footer.height, emailRight: email.right, emailTop: email.top, socialRight: socialLink.right, socialTop: socialLink.top };
  });

  expect(layout.footerHeight).toBeGreaterThanOrEqual(812 * 0.55);
  expect(layout.emailRight).toBeLessThanOrEqual(375);
  expect(layout.socialRight).toBeLessThanOrEqual(375);
  expect(Math.abs(layout.emailRight - layout.socialRight)).toBeLessThan(1);
  expect(layout.socialTop).toBeGreaterThan(layout.emailTop);
});

test("Footer stays readable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#footer .footer__booking")).toContainText("Booking / Inquiries");
  await expect(page.locator(".footer__waves canvas")).toHaveCount(0);
  await context.close();
});
