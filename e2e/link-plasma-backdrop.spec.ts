import { test, expect } from "@playwright/test";

// Locks the human-approved (2026-08-08) /link Plasma restyle. The backdrop is
// the first and only client JavaScript this route has ever shipped, so what
// needs protecting is not that it looks right but that it stays *optional*:
// the page must survive with no JS, no WebGL, and under reduced motion, and it
// must not quietly start costing the route its budget or its isolation.

const LINK = "/link";

// Screenshot-diffing a live canvas is flaky (Playwright waits for a stable
// frame a running rAF loop never yields) and only indirectly answers the
// question. Counting rAF calls tests the render loop itself.
const countRaf = {
  install: (page: import("@playwright/test").Page) =>
    page.addInitScript(() => {
      const w = window as unknown as { __raf: number };
      w.__raf = 0;
      const original = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => {
        w.__raf += 1;
        return original(cb);
      };
    }),
  read: (page: import("@playwright/test").Page) =>
    page.evaluate(() => (window as unknown as { __raf: number }).__raf),
};

async function hideTab(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(150);
}

test("backdrop renders, animates, and caps DPR at 2", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

  await countRaf.install(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(LINK);

  const canvas = page.locator("canvas[data-plasma]");
  // data-ready is only set after a frame actually draws, so this also proves
  // the shader compiled and linked rather than silently failing.
  await expect(canvas).toHaveAttribute("data-ready", "");

  const size = await canvas.evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height }));
  const dpr = await page.evaluate(() => Math.min(window.devicePixelRatio || 1, 2));
  expect(size.w).toBe(Math.round(375 * dpr));
  expect(size.h).toBe(Math.round(812 * dpr));

  const first = await countRaf.read(page);
  await expect.poll(() => countRaf.read(page)).toBeGreaterThan(first);

  expect(errors).toEqual([]);
});

test("a hidden tab pauses the render loop", async ({ page }) => {
  await countRaf.install(page);
  await page.goto(LINK);
  await expect(page.locator("canvas[data-plasma]")).toHaveAttribute("data-ready", "");

  await hideTab(page);
  const paused = await countRaf.read(page);
  await page.waitForTimeout(800);
  expect(await countRaf.read(page)).toBe(paused);
});

test("reduced motion renders one frame and never starts a loop", async ({ page }) => {
  await countRaf.install(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(LINK);

  // Still painted -- reduced motion removes the animation, not the artwork.
  await expect(page.locator("canvas[data-plasma]")).toHaveAttribute("data-ready", "");

  await page.waitForTimeout(800);
  expect(await countRaf.read(page)).toBe(0);
});

test("every action survives with JavaScript disabled", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(LINK);

  // The hero is a plain <img>; decoding="async" means load can fire before it
  // has rasterised, so wait for the decode rather than the navigation.
  const hero = page.locator(".identity__portrait");
  await hero.evaluate((img: HTMLImageElement) => img.decode?.());
  expect(await hero.evaluate((i: HTMLImageElement) => i.naturalWidth > 0)).toBe(true);

  // Same destinations the JS-enabled page offers: 3 socials, enter-site,
  // booking, plus the Music-clips section's YouTube anchors (added in the
  // /link clips amendment; thumbnails come from i.ytimg.com under CSP).
  // The sixth legacy anchor (show-tickets micro-link) disappeared
  // when Task 5.2's demo catalog marked every show `demo`, which correctly
  // renders no ticket destination; restore it in count when real shows land.
  await expect(page.locator(".link-page a[href]")).toHaveCount(9);
  await expect(page.locator(".enter-card")).toBeVisible();

  // The canvas never becomes ready, so the CSS gradient floor is what paints.
  await expect(page.locator("canvas[data-plasma]")).not.toHaveAttribute("data-ready", "");
  await ctx.close();
});

test("stays inside its budget and never reaches for the Hero sequence", async ({ page }) => {
  const requests: string[] = [];
  let bytes = 0;
  page.on("request", (r) => requests.push(r.url()));
  page.on("response", async (r) => {
    const len = (await r.allHeaders().catch(() => ({})))["content-length"];
    if (len) bytes += Number(len);
  });

  await page.goto(LINK, { waitUntil: "networkidle" });

  // Path-based only. The `\.avif` clause this used to also carry went dead when
  // the hero sequence moved to WebP (Task 4.2d), and it can't simply be swapped
  // for `\.webp`: /link legitimately loads `solbo-portrait.webp`.
  expect(requests.filter((u) => /hero-frames|frames-mobile/.test(u))).toEqual([]);
  expect(await page.evaluate(() => !!(window as never as { React?: unknown }).React)).toBe(false);
  // 200 KiB is the plan's budget for this route; the restyle spends ~86 KiB.
  expect(bytes).toBeLessThan(200 * 1024);
});
