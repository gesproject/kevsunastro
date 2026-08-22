import { test, expect } from "@playwright/test";

// Task 4.3 amendment -- the Music section's moss shader backdrop, a
// section-scoped mount of the same shared engine (src/lib/motion/
// shaderField.ts) /link's fixed Plasma backdrop uses, running a different
// shader (shaders/moss.ts vs shaders/plasma.ts). What's specific to a
// section-scoped mount (and not already covered by
// link-plasma-backdrop.spec.ts) is musicBackdrop.ts's own
// IntersectionObserver-driven pause/resume; the engine-level behavior
// (hidden-tab pause, reduced motion, no-JS floor, compile/draw/resize) is
// the same shared contract, already locked by link-plasma-backdrop.spec.ts
// against the exact engine module Music also imports.
//
// Getting the real Music section into view would mean out-scrolling Hero's
// Lenis-smoothed, GSAP-pinned "+=130%"/"+=160%" scroll range in a live
// browser -- slow, and it exercises Hero/Lenis/GSAP, not Music's own pause
// logic. Instead this stubs IntersectionObserver so musicBackdrop.ts's real
// code runs against a synthetic, instant "in view" / "out of view" signal --
// the exact contract it actually has with the browser, without needing
// Hero's scroll machinery to be correct or even present.
//
// `/` also runs Hero's own canvas engine and (outside reduced motion) GSAP's
// ticker, both separately calling requestAnimationFrame, unlike /link where
// its canvas is the only thing on the page -- so this counts WebGL
// drawArrays calls scoped to Music's own canvas rather than a page-wide rAF
// count. `/`'s progressive AVIF loading also means the `load` event doesn't
// fire promptly (see task-4.2-hero-sequence.spec.ts) and competes for
// bandwidth/decode time these tests don't need, so every test blocks
// hero-frames requests and uses domcontentloaded, the same technique
// task-4.2-hero-sequence.spec.ts uses for its own frame-independent checks.

const HOME = "/";

const countDraws = {
  install: (page: import("@playwright/test").Page) =>
    page.addInitScript(() => {
      const w = window as unknown as { __musicDraws: number };
      w.__musicDraws = 0;
      const original = WebGLRenderingContext.prototype.drawArrays;
      WebGLRenderingContext.prototype.drawArrays = function (this: WebGLRenderingContext, ...args) {
        const canvas = this.canvas as HTMLElement;
        if (canvas.hasAttribute?.("data-music-shader")) w.__musicDraws += 1;
        return original.apply(this, args as never);
      };
    }),
  read: (page: import("@playwright/test").Page) =>
    page.evaluate(() => (window as unknown as { __musicDraws: number }).__musicDraws),
};

async function hideTab(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(150);
}

// Replaces the real IntersectionObserver with one that starts every
// observed target as intersecting (so page-load behavior is unaffected) and
// exposes window.__setMusicVisible(bool) to fire a synthetic entry on
// demand. `/` isn't guaranteed to create only musicBackdrop.ts's observer --
// Hero has its own -- so this only wires up __setMusicVisible for a target
// carrying data-music-shader, rather than letting whichever .observe() call
// happens to run last silently win ownership of the hook.
function stubIntersectionObserver(page: import("@playwright/test").Page) {
  return page.addInitScript(() => {
    // A plain closure, not a class with a #private field: addInitScript
    // injects this as a raw, standalone script into the page, with no
    // guarantee the private-field runtime helper it'd compile to is
    // available there.
    function FakeIO(this: IntersectionObserver, cb: IntersectionObserverCallback) {
      this.observe = (target: Element) => {
        if ((target as HTMLElement).hasAttribute?.("data-music-shader")) {
          (window as unknown as { __setMusicVisible: (v: boolean) => void }).__setMusicVisible = (visible: boolean) => {
            cb([{ isIntersecting: visible, target } as IntersectionObserverEntry], this);
          };
        }
        cb([{ isIntersecting: true, target } as IntersectionObserverEntry], this);
      };
      this.unobserve = () => {};
      this.disconnect = () => {};
    }
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = FakeIO;
  });
}

function setMusicVisible(page: import("@playwright/test").Page, visible: boolean) {
  return page.evaluate((v) => (window as unknown as { __setMusicVisible?: (v: boolean) => void }).__setMusicVisible?.(v), visible);
}

// None of these tests care about Hero's own sequence -- blocking its 193-233
// AVIF requests (same technique task-4.2-hero-sequence.spec.ts already uses
// to test the mobile lock without waiting on real frames) keeps each test
// scoped to what it actually exercises.
function blockHeroFrames(page: import("@playwright/test").Page) {
  return page.route("**/hero-frames/**", (route) => route.abort());
}

test("backdrop renders and animates while the section is marked in view", async ({ page }) => {
  // Real JS exceptions only -- blockHeroFrames() deliberately aborts every
  // hero-frames request, and each abort logs its own "Failed to load
  // resource" console error that has nothing to do with Music.
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  await countDraws.install(page);
  await stubIntersectionObserver(page);
  await blockHeroFrames(page);
  await page.goto(HOME, { waitUntil: "domcontentloaded" });

  const canvas = page.locator("canvas[data-music-shader]");
  // data-ready is only set after a frame actually draws, so this also proves
  // the shader compiled and linked rather than silently failing.
  await expect(canvas).toHaveAttribute("data-ready", "");

  const first = await countDraws.read(page);
  await expect.poll(() => countDraws.read(page)).toBeGreaterThan(first);

  expect(errors).toEqual([]);
});

test("marking the section out of view pauses the render loop, and back in view resumes it", async ({ page }) => {
  // Waits for two separate draws from a loop that manages ~0.6fps on a
  // GPU-less runner (see DRAW_WAIT below), so the default 30s test budget is
  // not enough on its own.
  test.setTimeout(120_000);
  await countDraws.install(page);
  await stubIntersectionObserver(page);
  await blockHeroFrames(page);
  await page.goto(HOME, { waitUntil: "domcontentloaded" });

  const canvas = page.locator("canvas[data-music-shader]");
  await expect(canvas).toHaveAttribute("data-ready", "");
  // DRAW_WAIT, not the 5s default. Measured on this runner: with no GPU, `/`'s
  // two SwiftShader contexts get this loop about 2-3 draws per 4 seconds, so a
  // 5s budget for "at least one more draw" was a coin flip and this test
  // failed intermittently regardless of what it was testing. Waiting longer
  // for a ~0.6fps loop doesn't weaken the assertion -- the assertion is that
  // draws resume at all, not that they resume quickly. (Checked against a
  // masked and unmasked Music backdrop: identical draw counts, so the seam
  // mask added in the Hero push rework is not what makes this slow.)
  const DRAW_WAIT = { timeout: 30_000 };
  await expect.poll(() => countDraws.read(page), DRAW_WAIT).toBeGreaterThan(0);

  await setMusicVisible(page, false);
  const paused = await countDraws.read(page);
  await page.waitForTimeout(500);
  expect(await countDraws.read(page)).toBe(paused);

  // ...and resumes once it's back in view, proving this is a pause, not a
  // one-shot teardown.
  await setMusicVisible(page, true);
  await expect.poll(() => countDraws.read(page), DRAW_WAIT).toBeGreaterThan(paused);
});

test("a hidden tab pauses the render loop even while the section is in view", async ({ page }) => {
  await countDraws.install(page);
  await stubIntersectionObserver(page);
  await blockHeroFrames(page);
  await page.goto(HOME, { waitUntil: "domcontentloaded" });

  const canvas = page.locator("canvas[data-music-shader]");
  await expect(canvas).toHaveAttribute("data-ready", "");

  await hideTab(page);
  const paused = await countDraws.read(page);
  await page.waitForTimeout(500);
  expect(await countDraws.read(page)).toBe(paused);
});

test("reduced motion renders one frame and never starts a loop", async ({ page }) => {
  await countDraws.install(page);
  await stubIntersectionObserver(page);
  await blockHeroFrames(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(HOME, { waitUntil: "domcontentloaded" });

  const canvas = page.locator("canvas[data-music-shader]");
  // Still painted -- reduced motion removes the animation, not the artwork.
  await expect(canvas).toHaveAttribute("data-ready", "");

  const afterFirstPaint = await countDraws.read(page);
  expect(afterFirstPaint).toBeGreaterThan(0);
  await page.waitForTimeout(500);
  expect(await countDraws.read(page)).toBe(afterFirstPaint);
});

test("Music section content and links survive with JavaScript disabled", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(HOME, { waitUntil: "domcontentloaded" });

  const music = page.locator("#music");
  await expect(music.locator(".music__heading")).toHaveText("Releases");
  await expect(music.locator(".music__platforms, .player")).not.toHaveCount(0);

  // The canvas never becomes ready, so the section's own CSS gradient floor
  // -- the same no-JS fallback pattern PlasmaBackdrop.astro established for
  // /link, with the moss palette's own colours -- is what actually paints.
  await expect(music.locator("canvas[data-music-shader]")).not.toHaveAttribute("data-ready", "");
  const bg = await music.evaluate((el) => getComputedStyle(el.querySelector(".music__backdrop")!).backgroundImage);
  expect(bg).toContain("gradient");

  await ctx.close();
});
