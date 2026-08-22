import { test, expect } from "@playwright/test";

// Hero sequence acceptance, rewritten 2026-08-09 for the human-directed rework
// that replaced Task 4.2c's fired auto-advance with a CSS-sticky hero and a
// scroll-driven push.
//
// What changed for the tests: there is no GSAP pin anymore, so `.pin-spacer`
// (which several of the previous assertions keyed off) no longer exists -- the
// hero is held by `position: sticky` inside a tall `.hero-scene`, and Music
// overlaps its last viewport with a negative margin. And there is no
// `advanceToMusic()`, so "did it advance" is replaced by geometry: where
// Music's top edge actually sits, and whether everything comes back on the way
// up.
//
// Bar carried over unchanged from Task 4.2: never wait for all frames before
// doing anything, missing/failed frames degrade to the nearest valid one, and
// reduced motion never downloads the sequence it isn't going to scrub.

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "desktop", width: 1440, height: 900 },
];

/** Parks the decorative WebGL loops through the real `visibilitychange` path
 * each backdrop already listens to. CI/headless has no GPU, so these shaders
 * run on SwiftShader and starve the frame decodes badly enough to make load
 * progress -- not scroll position -- the thing the canvas appears to track.
 * None of the assertions here are about a shader animating. */
async function parkBackdrops(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

/** Same idea, but installed before any page script runs, so the shaders never
 * start a single frame. Needed when the thing under test is how *fast*
 * something happens: `parkBackdrops` can only run after navigation, by which
 * point SwiftShader has already had the CPU for a while. */
async function parkBackdropsFromLoad(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
  });
}

const drawnFrame = (page: import("@playwright/test").Page) =>
  page.evaluate(() => Number(document.querySelector<HTMLCanvasElement>(".hero__canvas")?.dataset.frame ?? -1));

test("mobile hero hides the loader on frame 0 without waiting for the rest of the sequence", async ({ page }) => {
  // The other frames are stalled 8s; the assertion budget below is what makes
  // this a real test of "frame 0 alone releases the loader" rather than of how
  // fast a GPU-less runner can decode the whole 117-frame set.
  await parkBackdropsFromLoad(page);
  await page.route("**/hero-frames/mobile/**", async (route) => {
    if (!route.request().url().endsWith("frame_0001.webp")) {
      await new Promise((resolve) => setTimeout(resolve, 8000));
    }
    await route.continue();
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".hero__loader")).toHaveAttribute("hidden", "", { timeout: 3000 });
});

for (const bp of BREAKPOINTS) {
  test(`${bp.name} lays out the sticky scene and the push overlap to the documented budget`, async ({ page }) => {
    // Pure geometry, so don't pay for a frame sequence to read it.
    await page.route("**/hero-frames/**", (route) => route.abort());
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.dataset.motionLifecycle), { timeout: 15000 })
      .toBe("active");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const music = document.querySelector<HTMLElement>("#music")!;
          const layout = music.parentElement?.classList.contains("pin-spacer") ? music.parentElement : music;
          return innerWidth < 768 || parseFloat(getComputedStyle(layout).marginTop) < -innerHeight * 0.95;
        }),
      )
      .toBe(true);

    const geom = await page.evaluate(() => {
      const music = document.querySelector<HTMLElement>("#music")!;
      // ScrollTrigger moves the section's margin onto its pin spacer on
      // desktop. The spacer is the element that owns the visible overlap.
      const layout = music.parentElement?.classList.contains("pin-spacer") ? music.parentElement : music;
      return {
        sceneH: document.querySelector(".hero-scene")!.getBoundingClientRect().height,
        heroPosition: getComputedStyle(document.querySelector("#hero")!).position,
        heroH: document.querySelector("#hero")!.getBoundingClientRect().height,
        musicMarginTop: parseFloat(getComputedStyle(layout).marginTop),
        musicTop: music.getBoundingClientRect().top + window.scrollY,
      };
    });

    // 100svh hero + 120svh of frame scrub (SCRUB_VH) + 100svh of push.
    expect(geom.sceneH).toBeGreaterThan(bp.height * 3.1);
    expect(geom.sceneH).toBeLessThan(bp.height * 3.3);
    expect(geom.heroPosition).toBe("sticky");
    expect(geom.heroH).toBeLessThan(bp.height * 1.05);
    // Music overlaps exactly the hero's last viewport of travel, so it finishes
    // covering at the same instant the hero unsticks.
    expect(geom.musicMarginTop).toBeLessThan(-bp.height * 0.95);
    expect(geom.musicTop).toBeGreaterThan(bp.height * 2.1);
    expect(geom.musicTop).toBeLessThan(bp.height * 2.3);
    expect(errors).toEqual([]);
  });

  test(`${bp.name} pushes Music up over a stationary hero and puts everything back on the way up`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));

    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await parkBackdrops(page);
    await expect(page.locator(".hero__loader")).toHaveAttribute("hidden", "", { timeout: 60000 });

    const heroTop = () => page.evaluate(() => document.querySelector("#hero")!.getBoundingClientRect().top);
    const musicTop = () => page.evaluate(() => document.querySelector("#music")!.getBoundingClientRect().top);

    expect(await musicTop()).toBeGreaterThan(bp.height * 2);

    // Far enough in that Music has fully covered the viewport.
    await page.evaluate((y) => window.scrollTo(0, y), bp.height * 2.2);
    await expect.poll(musicTop, { timeout: 15000 }).toBeLessThanOrEqual(1);
    // The hero did not scroll away to get there -- it stayed stuck at the top
    // and was covered. That is the difference between a push and a plain
    // scroll-off, and it is the whole point of the sticky rework.
    expect(Math.abs(await heroTop())).toBeLessThan(2);

    // The reported bug: coming back up used to show the body's #0a0a0a,
    // because advanceToMusic() faded #hero to opacity 0 and nothing restored
    // it. Nothing is faded by a fired tween anymore, and the scroll-linked
    // recede reads back to 0 on its own.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(musicTop, { timeout: 15000 }).toBeGreaterThan(bp.height * 2);
    await expect
      .poll(
        () => page.evaluate(() => Number(getComputedStyle(document.querySelector(".hero__canvas-wrap")!).opacity)),
        { timeout: 15000 },
      )
      .toBe(1);

    const restored = await page.evaluate(() => ({
      push: getComputedStyle(document.querySelector(".hero-scene")!).getPropertyValue("--push").trim(),
      heroOpacity: Number(getComputedStyle(document.querySelector("#hero")!).opacity),
      canvasOpacity: Number(getComputedStyle(document.querySelector(".hero__canvas-wrap")!).opacity),
      lockupOpacity: Number(getComputedStyle(document.querySelector(".hero__lockup")!).opacity),
    }));
    expect(restored.heroOpacity).toBe(1);
    expect(restored.canvasOpacity).toBe(1);
    expect(restored.lockupOpacity).toBe(1);
    expect(restored.push === "" || Number(restored.push) === 0).toBe(true);

    // And the scrub rewound with it.
    await expect.poll(() => drawnFrame(page), { timeout: 15000 }).toBe(0);
    expect(errors).toEqual([]);
  });
}

test("desktop scrub is driven by scroll position, and reverses", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await parkBackdrops(page);
  await expect(page.locator(".hero__loader")).toHaveAttribute("hidden", "", { timeout: 60000 });

  // Deliberately loose upper bound rather than an exact index: the canvas
  // converges on the scrubbed-to frame as later frames arrive (nearestLoaded
  // degrades backwards meanwhile), and on a GPU-less runner the pool is the
  // slow part. What is being asserted is that scroll position drives the
  // index at all, and that it comes back down -- the old build's failure mode
  // was an index that only ever tracked load progress.
  expect(await drawnFrame(page)).toBe(0);

  await page.evaluate(() => window.scrollTo(0, 540)); // half of SCRUB_VH
  await expect.poll(() => drawnFrame(page), { timeout: 60000 }).toBeGreaterThan(20);
  const mid = await drawnFrame(page);

  await page.evaluate(() => window.scrollTo(0, 1080)); // all of SCRUB_VH
  await expect.poll(() => drawnFrame(page), { timeout: 60000 }).toBeGreaterThan(mid);

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => drawnFrame(page), { timeout: 15000 }).toBe(0);
});

test("mobile scrolling still reaches Music even if every frame fails to load", async ({ page }) => {
  // The handoff is CSS now, so a dead frame set cannot strand anyone: this
  // asserts the section geometry survives with nothing drawn at all.
  await page.route("**/hero-frames/mobile/**", (route) => route.abort());
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  await page.evaluate(() => window.scrollTo(0, 812 * 2.2));
  await expect
    .poll(() => page.evaluate(() => document.querySelector("#music")!.getBoundingClientRect().top), { timeout: 15000 })
    .toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("back/forward navigation rebuilds the scrub instead of leaving a dead engine or duplicate listeners", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.motionLifecycle), { timeout: 15000 })
    .toBe("active");

  await page.goto("/link");
  await page.goBack();

  // Rebuilt, not left dead: the lifecycle is live again and the scene still
  // carries its scroll budget (which is gated on that lifecycle attribute, so
  // it collapses to 100svh if the engine failed to come back).
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.motionLifecycle), { timeout: 15000 })
    .toBe("active");
  await expect
    .poll(() => page.evaluate(() => document.querySelector(".hero-scene")!.getBoundingClientRect().height), { timeout: 15000 })
    .toBeGreaterThan(900 * 3.1);

  // Not duplicated: two racing ScrollTrigger instances would disagree about
  // --push, which is written on every update. Each poll attempt re-dispatches
  // the scroll: if ScrollTrigger's post-restore refresh() lands after our
  // first synthetic event, that single event is consumed against stale
  // geometry and no further update would ever fire -- a real user keeps
  // scrolling, so the test mirrors that instead of betting on refresh order.
  await expect
    .poll(async () => {
      await page.evaluate(() => {
        window.scrollTo(0, 1500);
        window.dispatchEvent(new Event("scroll"));
      });
      return page.evaluate(
        () => Number(getComputedStyle(document.querySelector(".hero-scene")!).getPropertyValue("--push").trim()),
      );
    }, { timeout: 15_000 })
    .toBeGreaterThan(0);
  const push = await page.evaluate(() => Number(getComputedStyle(document.querySelector(".hero-scene")!).getPropertyValue("--push").trim()));
  expect(push).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test("reduced motion loads only the final frame, never the sequence, and never expands the scene", async ({ page }) => {
  const heroFrameRequests: string[] = [];
  page.on("request", (req) => {
    if (/\/hero-frames\//.test(req.url())) heroFrameRequests.push(req.url());
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  expect(heroFrameRequests).toHaveLength(1);
  expect(heroFrameRequests[0]).toContain("frame_0117.webp");

  // No push either: the scene's extra height and Music's pull-up are both
  // gated on the active lifecycle, so this collapses to an ordinary stack of
  // sections that plain scrolling walks through.
  const geom = await page.evaluate(() => ({
    sceneH: document.querySelector(".hero-scene")!.getBoundingClientRect().height,
    musicMarginTop: parseFloat(getComputedStyle(document.querySelector("#music")!).marginTop),
  }));
  expect(geom.sceneH).toBeLessThan(900 * 1.05);
  expect(geom.musicMarginTop).toBe(0);
});
