import { test, expect } from "@playwright/test";

// Task 4.1 acceptance: init runs once per visit with no duplicate
// listeners/tickers, resize/navigation/teardown stay clean, and native
// scrolling keeps working if the motion script never runs at all.

test("motion lifecycle activates once on /, with no console errors", async ({ page }) => {
  // This test cannot take the shortcut the other `/` specs take. They block
  // the hero frames outright, but each blocked request logs its own "Failed to
  // load resource" console error, and this is the one test that asserts the
  // console is clean — so it has to sit through the real sequence, on a runner
  // with no GPU where two SwiftShader contexts and 117 decodes contend for the
  // main thread that `page.evaluate` also needs. 30s does not cover that here.
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // domcontentloaded, not the default `load`: `/`'s progressively loaded hero
  // sequence holds the `load` event for ~11.5s headless, which does not fit a
  // 30s budget alongside the rest of this test and is not what it checks. The
  // lifecycle attribute is set from a module script, long before the frames
  // finish. (Same reason the other `/` specs in this suite already do this.)
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "active");
  expect(errors).toEqual([]);

  // A second, synthetic bfcache-restore signal must hit the init guard
  // (dataset already "active") instead of attaching a second ticker/listener
  // set; if the guard were broken this would either throw or reset state.
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });
  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "active");
  expect(errors).toEqual([]);
});

test("reduced motion skips Lenis/GSAP but native scroll still works", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "reduced");

  await page.evaluate(() => window.scrollTo(0, 400));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

// Changed 2026-08-08: this asserted 0 script tags on /link until the
// human-approved Plasma backdrop restyle gave the route exactly one -- the
// decorative WebGL canvas. The invariant it was really protecting (no motion
// library, no React, nothing that pulls in the Hero sequence) is unchanged and
// is now asserted directly rather than via a script-tag count of zero.
test("/link ships only the decorative backdrop script and never activates motion", async ({ page }) => {
  await page.goto("/link");
  await expect(page.locator("html")).not.toHaveAttribute("data-motion-lifecycle", "active");

  const srcs = await page.locator("script").evaluateAll((els) =>
    els.map((el) => (el as HTMLScriptElement).src),
  );
  expect(srcs).toHaveLength(1);
  expect(srcs[0]).toContain("PlasmaBackdrop");
});

// Whether Chromium under Playwright/CDP actually grants this a bfcache
// restore (vs. a plain reload) isn't guaranteed either way -- this test
// passes either way and is a real-navigation sanity check, not proof of the
// bfcache path specifically. The synthetic dispatch above is the
// deterministic check for that exact code path.
test("back/forward navigation tears down and re-activates cleanly", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(String(err)));

  // domcontentloaded, not the default `load`. `/` progressively loads a
  // 117-frame hero sequence, so its `load` event does not fire until every
  // frame has — measured at ~11.5s headless — and this test navigates to `/`
  // twice. Three `load` waits do not fit a 30s budget, and none of them are
  // what is under test here: the lifecycle attribute is set from a module
  // script, long before the last frame lands. Same technique, for the same
  // reason, as task-4.2-hero-sequence.spec.ts and task-4.3-music-backdrop.spec.ts.
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "active");

  await page.goto("/link", { waitUntil: "domcontentloaded" });
  await page.goBack({ waitUntil: "domcontentloaded" });

  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "active");
  expect(errors).toEqual([]);
});
