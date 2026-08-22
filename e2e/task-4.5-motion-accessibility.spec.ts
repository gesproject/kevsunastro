import { expect, test } from "@playwright/test";

function blockHeroFrames(page: import("@playwright/test").Page) {
  return page.route("**/hero-frames/**", (route) => route.abort());
}

test("every homepage keyboard stop is named, visible, and has a focus ring", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const expectedStops = await page.locator("a[href]").count();
  let stops = 0;
  for (let index = 0; index < expectedStops; index += 1) {
    await page.keyboard.press("Tab");
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            let element = document.activeElement as HTMLElement | null;
            let opacity = 1;
            while (element && element !== document.documentElement) {
              const style = getComputedStyle(element);
              if (style.visibility === "hidden" || style.display === "none") return false;
              opacity *= Number(style.opacity);
              element = element.parentElement;
            }
            return opacity > 0;
          }),
        { timeout: 5000 },
      )
      .toBe(true);
    const stop = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return null;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        name: (element.getAttribute("aria-label") ?? element.textContent ?? "").trim(),
        visible: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight,
        painted: style.visibility !== "hidden" && Number(style.opacity) > 0,
        hasFocusRing: style.outlineStyle !== "none" && style.outlineWidth !== "0px",
      };
    });

    if (!stop) throw new Error(`focus disappeared at stop ${index + 1}`);
    stops += 1;
    expect(stop.name, `unnamed focus stop ${stops}`).not.toBe("");
    expect(stop.visible, `off-screen focus stop ${stops}: ${stop.name}`).toBe(true);
    expect(stop.painted, `unpainted focus stop ${stops}: ${stop.name}`).toBe(true);
    expect(stop.hasFocusRing, `missing focus ring on ${stop.name}`).toBe(true);
  }

  expect(stops).toBe(expectedStops);
});

test("a persisted restore keeps scroll position and rebuilds motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await blockHeroFrames(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.mouse.wheel(0, 120);
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  const before = await page.evaluate(() => Math.round(window.scrollY));
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
  });

  await expect(page.locator("html")).toHaveAttribute("data-motion-lifecycle", "active");
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(before);
});
