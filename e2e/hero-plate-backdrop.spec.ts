import { test, expect } from "@playwright/test";

// Hero footage/backdrop acceptance, rewritten 2026-08-09 (was
// hero-keyed-backdrop.spec.ts).
//
// The premise inverted. Task 4.2b/c keyed the studio plate to alpha, and this
// suite's central assertion was that the plate came back *transparent*. The
// human rejected that treatment -- the silhouette edge it left was the
// reported "cut out behind the subject" -- so the frames are opaque again and
// the plate is dissolved into the shader by a CSS mask instead. The assertion
// therefore flips: the drawn bitmap must be fully opaque, and the dissolve is
// checked where it now lives, on the mask.
//
// Note the division of labour: `getImageData` reads the canvas bitmap, which
// CSS masking does not touch. That is exactly why the two halves can be
// asserted independently.

/** Parks every decorative WebGL loop on the page through the real
 * `visibilitychange` path each backdrop already listens to. Not cosmetic:
 * CI/headless has no GPU, so these shaders run on SwiftShader, and `/` carries
 * two of them. Left running, they saturate the CPU alongside the frame decodes
 * badly enough to stall `getImageData` and even `setViewportSize`. None of the
 * assertions below are about a shader animating, and it leaves the last drawn
 * frame in place, so `data-ready` still means what it meant. */
async function parkBackdrops(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

/** Reads the hero canvas back as raw RGBA and summarises what's actually
 * drawn. Alpha is still the point, just with the opposite expectation. */
async function canvasStats(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector(".hero__canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let opaque = 0;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 250) opaque++;
      else if (data[i] < 5) transparent++;
    }
    const total = data.length / 4;
    return { total, opaquePct: (opaque / total) * 100, transparentPct: (transparent / total) * 100 };
  });
}

/** Full-canvas RGBA fingerprint, for comparing two scrub positions. */
async function canvasPixels(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector(".hero__canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  });
}

// These read the canvas back pixel by pixel on a page that decodes 117 frames
// and drives up to three WebGL canvases, so they need more than the 30s
// default. They wait on conditions, not sleeps.
test.describe.configure({ timeout: 120_000 });

test("desktop hero draws the footage opaque — the plate is back, nothing is keyed out", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await parkBackdrops(page);
  await expect(page.locator(".hero__loader")).toHaveAttribute("hidden", "", { timeout: 60000 });
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector(".hero__canvas") as HTMLCanvasElement | null;
      if (!canvas || !canvas.width) return false;
      const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
      let opaque = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 250) opaque++;
      return opaque / (data.length / 4) > 0.5;
    },
    { timeout: 60000 },
  );

  const stats = await canvasStats(page);
  // The canvas is sized to the drawn frame's own box, and the frame carries
  // its studio plate, so essentially every pixel is opaque. A meaningful
  // transparent share here would mean the keyed set came back.
  expect(stats.opaquePct).toBeGreaterThan(99);
  expect(stats.transparentPct).toBeLessThan(0.5);
});

// Computed style normalises gradient direction: `to right` resolves to
// `90deg`, while `to bottom` is the default and is dropped from the
// serialisation entirely. Hence the stop percentage rather than the axis as
// the shared discriminator -- 32% of the footage's width is desktop's plate
// margin, 16% of its height is mobile's.
for (const bp of [
  { name: "desktop", width: 1440, height: 900, maskContains: ["90deg", "rgb(0, 0, 0) 32%"] },
  { name: "mobile", width: 375, height: 812, maskContains: ["rgb(0, 0, 0) 16%"] },
]) {
  test(`${bp.name} dissolves the plate with a mask instead of cutting the subject out`, async ({ page }) => {
    await page.route("**/hero-frames/**", (route) => route.abort());
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await parkBackdrops(page);

    const styles = await page.evaluate(() => {
      const canvas = getComputedStyle(document.querySelector(".hero__canvas")!);
      const plate = getComputedStyle(document.querySelector(".hero__plate")!);
      return {
        canvasMask: canvas.maskImage || canvas.webkitMaskImage,
        plateBackground: plate.backgroundImage,
      };
    });

    // The footage's own edge fades out over its plate margin...
    expect(styles.canvasMask).toContain("linear-gradient");
    expect(styles.canvasMask).toContain("rgba(0, 0, 0, 0) 0%");
    for (const part of bp.maskContains) expect(styles.canvasMask).toContain(part);
    // ...onto a matching field of the plate's own measured colour, which is
    // what makes the fade land on more grey rather than straight onto the
    // shader. rgb(187, 187, 187) is #BBBBBB, verified flat across the master
    // frames.
    expect(styles.plateBackground).toContain("rgb(187, 187, 187)");
  });
}

test("desktop scrub changes the drawn frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await parkBackdrops(page);
  await expect(page.locator(".hero__loader")).toHaveAttribute("hidden", "", { timeout: 60000 });

  const before = await canvasPixels(page);
  // Inside the frame scrub's range (SCRUB_VH is 120% of the 900px viewport).
  await page.evaluate(() => window.scrollTo(0, 400));

  const pct = await page.waitForFunction(
    (before) => {
      const canvas = document.querySelector(".hero__canvas") as HTMLCanvasElement;
      const { data } = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height);
      if (data.length !== before.length) return false;
      let differing = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== before[i] || data[i + 3] !== before[i + 3]) differing++;
      }
      const p = (differing / (data.length / 4)) * 100;
      return p > 2 ? p : false;
    },
    before,
    { timeout: 60000 },
  );
  expect(await pct.jsonValue()).toBeGreaterThan(2);
});

test("backdrop shader runs at both breakpoints", async ({ page }) => {
  // This assertion only needs the independent WebGL canvas. Letting each
  // navigation also begin a 117-frame Hero load adds 234 irrelevant asset
  // requests to the same local Worker and can reset its inspector proxy before
  // the next test; other cases cover the sequence itself.
  await page.route("**/hero-frames/**", (route) => route.abort());

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const shader = page.locator("canvas[data-hero-shader]");
    await expect(shader).toBeVisible();
    // data-ready is set by the script only after a frame actually renders.
    await expect(shader).toHaveAttribute("data-ready", "", { timeout: 15000 });
  }
});

test("both breakpoints play the same footage — there is no second hero on mobile", async ({ page }) => {
  // Task 4.2c shipped mobile against a different shoot entirely (1176x1080,
  // its own room background), which is what read as "two heroes in one file".
  // Both sets are now crops of the same 1920x1080 master, so this asserts the
  // one property that would break if a second source crept back: matching
  // frame counts, and a mobile request that resolves at all.
  for (const bp of [
    { dir: "desktop", width: 1440, height: 900 },
    { dir: "mobile", width: 375, height: 812 },
  ]) {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    const first = await page.request.get(`/hero-frames/${bp.dir}/frame_0001.webp`);
    const last = await page.request.get(`/hero-frames/${bp.dir}/frame_0117.webp`);
    const past = await page.request.get(`/hero-frames/${bp.dir}/frame_0118.webp`);
    expect(first.status(), `${bp.dir} frame 1`).toBe(200);
    expect(last.status(), `${bp.dir} frame 117`).toBe(200);
    expect(past.status(), `${bp.dir} has exactly 117 frames`).toBe(404);
  }
});

test("hero carries no social navigation at either breakpoint", async ({ page }) => {
  // Pure markup assertion — the frame sequence is irrelevant to it.
  await page.route("**/hero-frames/**", (route) => route.abort());

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 375, height: 812 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await parkBackdrops(page);
    await expect(page.locator("#hero nav")).toHaveCount(0);
    await expect(page.locator("#hero a[href*='instagram.com']")).toHaveCount(0);
    // The site still offers them elsewhere, so this is a hero-scope removal.
    await expect(page.locator("a[href*='instagram.com']")).not.toHaveCount(0);
  }
});
