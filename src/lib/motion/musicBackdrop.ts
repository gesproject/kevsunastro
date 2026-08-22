import { initBarField, type BarFieldHandle } from "./barField";

/**
 * Mounts the vertical bar field (barField.ts) behind the Music section,
 * scoped to that section instead of the fixed full-viewport mount /link's
 * Plasma backdrop uses. A section-scoped canvas routinely scrolls
 * off-screen, which /link's never does -- an IntersectionObserver pauses
 * the rAF loop while it's out of view, on top of the engine's own
 * hidden-tab and reduced-motion pauses.
 *
 * Guarded like heroSequence.ts's initHeroSequence(): idempotent against
 * re-entry, torn down on pagehide and rebuilt on the next bfcache-restore
 * pageshow so a restored page doesn't keep a dead observer/loop around.
 * Deliberately independent of lifecycle.ts's Lenis/GSAP engine -- this is
 * an ambient, non-scroll-driven background, not a scroll-scrubbed timeline,
 * so it has nothing to coordinate with Hero's ScrollTrigger work.
 *
 * (2026-08-22) Replaced the moss WebGL shader with the human-supplied
 * vertical-bars canvas field, ported vanilla per the repo's no-island rule.
 * The mount contract -- observer, pauses, teardown -- is unchanged.
 */
let active = false;

export function initMusicBackdrop(): void {
  if (active) return;
  const canvas = document.querySelector<HTMLCanvasElement>("[data-music-shader]");
  if (!canvas) return;
  const section = canvas.closest<HTMLElement>("section");
  if (!section) return;

  const handle: BarFieldHandle | null = initBarField(canvas, section);
  if (!handle) return; // No canvas context: the section's CSS gradient floor stands in.

  active = true;
  const observer = new IntersectionObserver(([entry]) => handle.setVisible(entry.isIntersecting), {
    rootMargin: "20% 0px",
  });
  observer.observe(canvas);

  window.addEventListener(
    "pagehide",
    () => {
      observer.disconnect();
      handle.dispose();
      active = false;
    },
    { once: true },
  );
}

// Module-scope, registered once (see lifecycle.ts for why): rebuilds the
// engine after a bfcache restore, since pagehide above already tore it down.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) initMusicBackdrop();
});
