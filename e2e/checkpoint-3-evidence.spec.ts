import { test } from "@playwright/test";
import fs from "node:fs";

// Checkpoint 3 evidence: viewport parity captures and a keyboard-focus pass,
// blocked all prior session on no browser being available (Tasks 3.1-3.6).
// ponytail: one-shot evidence generator, not a regression suite -- ok to
// leave in e2e/ since it's cheap to re-run, but it isn't asserting anything.

// Each capture waits for `load` (~11.5s on `/`, which holds it until the whole
// hero sequence lands), scrolls the document a viewport at a time to settle
// lazy content, and then takes a fullPage screenshot. `/` became a ~4160px
// document in Task 4.2d — the hero's scroll runway is 320svh now — so on a
// GPU-less runner that no longer fits the 30s default.
test.describe.configure({ timeout: 180_000 });

const outDir = "tasks/astro-migration/references/checkpoint-3-captures";
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: "mobile-375x812", width: 375, height: 812 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "desktop-1440x900", width: 1440, height: 900 },
];

const routes = [
  { name: "home", path: "/" },
  { name: "link", path: "/link" },
];

// fullPage screenshots resize to the full document height and capture in one
// pass, which outruns two things: native loading="lazy" images (blank boxes
// -- the browser hasn't decided to fetch them yet) and off-screen `position:
// sticky` content, which Chromium doesn't always paint/composite until it's
// been scrolled near the viewport at least once. Force-eager images, then
// walk the page top to bottom so everything's been painted before capturing.
// /link's Plasma backdrop runs a continuous rAF loop, and page.screenshot()
// waits for a stable frame it will never get -- every /link capture below
// timed out once the backdrop shipped. Driving the component's own
// visibilitychange pause stops the loop on its last drawn frame, so the
// capture still shows the real artwork. Guarded on the canvas existing so `/`
// (whose own hero sequence would also react to a hidden document) is untouched.
async function pauseBackdrop(page: import("@playwright/test").Page) {
  const paused = await page.evaluate(() => {
    if (!document.querySelector("canvas[data-plasma]")) return false;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    return true;
  });
  if (paused) await page.waitForTimeout(150);
}

async function settlePage(page: import("@playwright/test").Page) {
  await pauseBackdrop(page);
  await page.evaluate(async () => {
    const imgs = Array.from(document.images);
    imgs.forEach((img) => (img.loading = "eager"));
    await Promise.all(
      imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((res) => (img.onload = img.onerror = res)))),
    );
  });
  await page.evaluate(async () => {
    const step = window.innerHeight;
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((res) => requestAnimationFrame(res));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(100);
}

for (const viewport of viewports) {
  for (const route of routes) {
    test(`capture ${route.name} @ ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(route.path);
      await settlePage(page);
      await page.screenshot({
        path: `${outDir}/${route.name}-${viewport.name}.png`,
        fullPage: true,
      });
    });
  }
}

// Reduced-motion review: same routes, desktop viewport, motion preference
// emulated off. Phase 3 ships no motion library yet, so this mainly proves
// the global prefers-reduced-motion rule doesn't visually break anything.
for (const route of routes) {
  test(`capture ${route.name} @ reduced-motion`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route.path);
    await settlePage(page);
    await page.screenshot({
      path: `${outDir}/${route.name}-reduced-motion-1440x900.png`,
      fullPage: true,
    });
  });
}

// Keyboard-focus pass: Tab through every focusable element, record the
// order and whether a visible focus indicator is present, and screenshot
// the first few stops plus the last one as visual proof.
for (const route of routes) {
  test(`keyboard focus @ ${route.name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route.path);
    await pauseBackdrop(page);

    const log: string[] = [`# Keyboard focus order — ${route.path}\n`];
    let stop = 0;
    const maxStops = 60;

    while (stop < maxStops) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const probeAttr = "data-focus-probe-seen";
        const alreadySeen = el.hasAttribute(probeAttr);
        el.setAttribute(probeAttr, "1");
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || "").trim().slice(0, 60),
          ariaLabel: el.getAttribute("aria-label"),
          href: el.getAttribute("href"),
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          visible: rect.width > 0 && rect.height > 0,
          alreadySeen,
        };
      });

      if (!info || info.alreadySeen) break; // no more focusables, or wrapped back
      stop++;

      const hasVisibleOutline = info.outlineStyle !== "none" && info.outlineWidth !== "0px";
      const name = info.text || info.ariaLabel || "(no accessible name)";
      log.push(
        `${stop}. <${info.tag}> "${name}"${info.href ? ` href=${info.href}` : ""} — focus-visible outline: ${hasVisibleOutline ? `yes (${info.outlineWidth} ${info.outlineStyle})` : "NO"}`,
      );

      if (stop <= 3 || stop === 1) {
        await page.screenshot({ path: `${outDir}/${route.name}-focus-${stop}.png` });
      }
    }
    await page.screenshot({ path: `${outDir}/${route.name}-focus-last.png` });

    log.push(`\nTotal focus stops: ${stop}`);
    fs.writeFileSync(`${outDir}/${route.name}-focus-order.md`, log.join("\n"));
  });
}
