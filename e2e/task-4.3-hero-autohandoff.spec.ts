import { expect, test } from "@playwright/test";

// Task 4.3 â€” Hero's opening intro is a real Lenis scroll through the frame
// scrub only. These tests deliberately assert its public behaviour instead of
// its implementation details: it stops on the final frame before Music enters,
// repeats on a normal reload, can be interrupted immediately, and leaves the
// manual/reduced-motion paths in control.

test.describe.configure({ timeout: 120_000 });

const desktop = { width: 1440, height: 900 };
const mobile = { width: 375, height: 812 };

async function heroHandoffState(page: import("@playwright/test").Page) {
  return page.locator(".hero-scene").getAttribute("data-hero-autohandoff");
}

/** The opening intro begins after the first paint, not after the whole
 * sequence. Keep this suite on that exact critical path and allow the two
 * frames its contract needs: first for the first paint and last for the stop
 * state. */
async function loadIntroFrames(page: import("@playwright/test").Page) {
  // The two WebGL fields are decorative and have their own coverage. Turning
  // them off here avoids software-renderer starvation while the test measures
  // the Hero's independent canvas/Lenis handoff; unlike a visibilitychange,
  // this does not alter the auto-handoff's eligibility state.
  await page.addInitScript(() => {
    const nativeGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId, ...args) {
      if (contextId === "webgl" || contextId === "webgl2" || contextId === "experimental-webgl") return null;
      return nativeGetContext.call(this, contextId, ...args);
    };
  });

  await page.route("**/hero-frames/**", (route) => {
    if (/frame_(0001|0117)\.webp$/.test(route.request().url())) return route.continue();
    return route.abort();
  });
}

test("fresh entry stops on the final Hero frame before Music, then a normal reload replays it", async ({ page }) => {
  await page.setViewportSize(desktop);
  await loadIntroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // The first decoded canvas paint starts the deliberate 1.2s pause. Waiting
  // for this hook, rather than an arbitrary load delay, proves the transition
  // never runs over the poster/loader state.
  await expect.poll(() => heroHandoffState(page), { timeout: 60_000 }).toBe("pending");
  await expect.poll(() => heroHandoffState(page), { timeout: 15_000 }).toBe("completed");
  await expect.poll(
    () => page.evaluate(() => Math.round(window.scrollY)),
    { timeout: 15_000 },
  ).toBe(Math.round(desktop.height * 1.2));
  await expect.poll(
    () => page.evaluate(() => Math.round(document.querySelector("#music")!.getBoundingClientRect().top)),
    { timeout: 15_000 },
  ).toBeGreaterThanOrEqual(desktop.height - 1);
  await expect(page.locator(".hero__canvas")).toHaveAttribute("data-frame", "116");

  // The intro drove the existing real scroll range rather than fading the Hero
  // away. Returning to the top therefore restores the exact visual state,
  // including the scroll-linked push value, without another fired tween to
  // undo.
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBe(0);
  await expect.poll(
    () => page.evaluate(() => document.querySelector("#music")!.getBoundingClientRect().top),
    { timeout: 15_000 },
  ).toBeGreaterThan(desktop.height * 2);
  // ScrollTrigger's scrub intentionally settles over 0.6s, so prove the
  // visual reset has converged rather than sampling its expected easing tail.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Number(getComputedStyle(document.querySelector(".hero-scene")!).getPropertyValue("--push").trim() || 0),
        ),
      { timeout: 15_000 },
    )
    .toBe(0);
  await expect(page.locator(".hero__canvas")).toHaveAttribute("data-frame", "0");

  // A normal reload is a fresh introduction, so it intentionally replays.
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(() => heroHandoffState(page), { timeout: 15_000 }).toBe("completed");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY)), { timeout: 15_000 }).toBe(
    Math.round(desktop.height * 1.2),
  );

  // A bfcache restore reuses the JavaScript realm after its pagehide teardown,
  // so this proves the new timer/listeners do not duplicate when the Hero is
  // revisited through normal browser history.
  await page.goto("/link", { waitUntil: "domcontentloaded" });
  await page.goBack({ waitUntil: "domcontentloaded" });
  await expect.poll(() => heroHandoffState(page), { timeout: 15_000 }).toBe("skipped");
  await page.waitForTimeout(3_000);
  expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(Math.round(desktop.height * 1.2));
});

test("mobile performs the same intro and leaves Music for manual scroll", async ({ page }) => {
  await page.setViewportSize(mobile);
  await loadIntroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect.poll(() => heroHandoffState(page), { timeout: 60_000 }).toBe("completed");
  await expect.poll(
    () => page.evaluate(() => Math.round(window.scrollY)),
    { timeout: 15_000 },
  ).toBe(Math.round(mobile.height * 1.2));
  await expect.poll(
    () => page.evaluate(() => Math.round(document.querySelector("#music")!.getBoundingClientRect().top)),
    { timeout: 15_000 },
  ).toBeGreaterThanOrEqual(mobile.height - 1);
  await expect(page.locator(".hero__canvas")).toHaveAttribute("data-frame", "116");
});

test("any deliberate scroll input cancels the pending handoff and leaves control with the visitor", async ({ page }) => {
  await page.setViewportSize(desktop);
  await loadIntroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => heroHandoffState(page), { timeout: 60_000 }).toBe("pending");

  await page.mouse.wheel(0, 120);
  await expect.poll(() => heroHandoffState(page), { timeout: 15_000 }).toBe("cancelled");
  await page.waitForTimeout(3_000);

  // The small wheel move may be Lenis-smoothed, but it must never be replaced
  // by the automatic move to the frame-scrub endpoint after its timer expires.
  expect(
    await page.evaluate(() => document.querySelector("#music")!.getBoundingClientRect().top),
  ).toBeGreaterThan(desktop.height);
});

test("keyboard input interrupts a handoff already in motion", async ({ page }) => {
  await page.setViewportSize(desktop);
  await loadIntroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => heroHandoffState(page), { timeout: 60_000 }).toBe("running");

  await page.keyboard.press("ArrowDown");
  await expect.poll(() => heroHandoffState(page), { timeout: 15_000 }).toBe("cancelled");
  await page.waitForTimeout(3_000);

  // Cancellation freezes Lenis at the currently visible position, then lets
  // the Arrow key's ordinary scroll continue. It must not resume its old
  // target once the original 2.4s duration would have elapsed.
  expect(
    await page.evaluate(() => document.querySelector("#music")!.getBoundingClientRect().top),
  ).toBeGreaterThan(desktop.height);
});

test("touch input cancels the mobile handoff before it moves", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: mobile });
  const page = await context.newPage();
  await loadIntroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => heroHandoffState(page), { timeout: 60_000 }).toBe("pending");

  await page.touchscreen.tap(20, 20);
  await expect.poll(() => heroHandoffState(page), { timeout: 15_000 }).toBe("cancelled");
  await page.waitForTimeout(3_000);
  expect(
    await page.evaluate(() => document.querySelector("#music")!.getBoundingClientRect().top),
  ).toBeGreaterThan(mobile.height);
  await context.close();
});

test("reduced motion and deep links never start the automatic handoff", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize(desktop);
  await loadIntroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3_000);
  await expect(page.locator(".hero-scene")).not.toHaveAttribute("data-hero-autohandoff");
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  // The query forces a fresh document after the reduced-motion page above;
  // changing only a hash would be a same-document navigation and would not
  // execute the Hero module again.
  await page.goto("/?handoff-deeplink#music", { waitUntil: "domcontentloaded" });
  await expect.poll(() => heroHandoffState(page), { timeout: 15_000 }).toBe("skipped");
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeGreaterThan(0);
});

test("without JavaScript the Hero and Music remain a normal native-scrolling document", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: mobile });
  const page = await context.newPage();
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#hero h1")).toBeVisible();
  const geometry = await page.evaluate(() => ({
    sceneHeight: document.querySelector(".hero-scene")!.getBoundingClientRect().height,
    musicMarginTop: parseFloat(getComputedStyle(document.querySelector("#music")!).marginTop),
  }));
  expect(geometry.sceneHeight).toBeLessThan(mobile.height * 1.05);
  expect(geometry.musicMarginTop).toBe(0);
  await context.close();
});
