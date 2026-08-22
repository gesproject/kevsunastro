import { initShaderField } from "./shaderField";
import { wavesShader } from "./shaders/waves";

/**
 * Mounts the shared WebGL engine (shaderField.ts) behind the Shows section
 * with the human-supplied waves palette (shaders/waves.ts) -- a section-
 * scoped mount like Music's, so an IntersectionObserver pauses the rAF loop
 * while it's out of view, on top of the engine's own hidden-tab and
 * reduced-motion pauses.
 *
 * Guarded like heroSequence.ts's initHeroSequence(): idempotent against
 * re-entry, torn down on pagehide and rebuilt on the next bfcache-restore
 * pageshow. Deliberately independent of lifecycle.ts's Lenis/GSAP engine --
 * an ambient background, not a scroll-scrubbed timeline.
 */
let active = false;

export function initShowsBackdrop(): void {
  if (active) return;
  const canvas = document.querySelector<HTMLCanvasElement>("[data-shows-shader]");
  if (!canvas) return;

  const handle = initShaderField(canvas, wavesShader);
  if (!handle) return; // No WebGL: the section's CSS gradient floor stands in.

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
  if (event.persisted) initShowsBackdrop();
});
