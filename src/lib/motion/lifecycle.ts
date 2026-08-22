import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let activeLenis: Lenis | null = null;

interface MotionScrollOptions {
  duration: number;
  easing: (progress: number) => number;
  onComplete: () => void;
}

/**
 * Routes a deliberate programmatic move through the one Lenis instance that
 * already owns page scrolling. Calling `window.scrollTo({ behavior: "smooth" })`
 * alongside Lenis creates two competing scroll animators, which is exactly
 * the kind of micro-jitter the Hero handoff must avoid.
 */
export function scrollMotionTo(target: number | HTMLElement, options: MotionScrollOptions): boolean {
  if (!activeLenis) return false;

  activeLenis.scrollTo(target, {
    duration: options.duration,
    easing: options.easing,
    onComplete: options.onComplete,
  });
  return true;
}

/** Stops only Lenis's current interpolation, then immediately returns native
 * input control to it. `stop()` resets Lenis's internal animator, so the
 * subsequent `start()` leaves the user at the exact visible position rather
 * than snapping to an old target or trapping their next wheel/touch input. */
export function cancelMotionScroll(): void {
  if (!activeLenis) return;
  activeLenis.stop();
  activeLenis.start();
}

/**
 * Shared route-scoped motion engine for `/`: one Lenis instance driven by
 * gsap.ticker, with ScrollTrigger registered and kept in sync. Tasks 4.2-4.4
 * add their own ScrollTriggers/timelines on top of this; they don't need
 * their own ticker or teardown wiring.
 *
 * `data-motion-lifecycle` on <html> is a query hook for tests, not styling:
 * "active" once Lenis/GSAP are running, "reduced" when skipped for
 * prefers-reduced-motion, absent again after teardown.
 *
 * Returns whether GSAP/ScrollTrigger are live, so a section-specific module
 * (Task 4.2's hero sequence, Task 4.3's other timelines) knows whether it's
 * safe to register its own ScrollTriggers or whether it should render its
 * reduced-motion/static path instead.
 */
export function initMotionLifecycle(): boolean {
  const root = document.documentElement;
  if (root.dataset.motionLifecycle === "active") return true;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.dataset.motionLifecycle = "reduced";
    return false;
  }

  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  const raf = (time: number) => lenis.raf(time * 1000);

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  activeLenis = lenis;
  root.dataset.motionLifecycle = "active";

  const onKeydown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.matches("a, button, input, select, textarea, [contenteditable='true']")) return;

    const page = window.innerHeight * 0.9;
    const limit = document.documentElement.scrollHeight - window.innerHeight;
    const current = window.scrollY;
    const target =
      event.key === "ArrowDown"
        ? current + 40
        : event.key === "ArrowUp"
          ? current - 40
          : event.key === "PageDown" || (event.code === "Space" && !event.shiftKey)
            ? current + page
            : event.key === "PageUp" || (event.code === "Space" && event.shiftKey)
              ? current - page
              : event.key === "Home"
                ? 0
                : event.key === "End"
                  ? limit
                  : undefined;
    if (target === undefined) return;

    event.preventDefault();
    lenis.scrollTo(Math.max(0, Math.min(limit, target)));
  };
  window.addEventListener("keydown", onKeydown);

  window.addEventListener(
    "pagehide",
    () => {
      window.removeEventListener("keydown", onKeydown);
      gsap.ticker.remove(raf);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
      delete root.dataset.motionLifecycle;
    },
    { once: true },
  );

  return true;
}

// Registered once at module scope -- ES modules are singletons per
// specifier, so this never accumulates a second listener. A bfcache
// restore resumes this exact JS context after pagehide has already torn
// things down above, so it needs an explicit re-init rather than picking
// up where it left off.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) initMotionLifecycle();
});
