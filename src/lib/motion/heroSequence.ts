import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cancelMotionScroll, initMotionLifecycle, scrollMotionTo } from "./lifecycle";

const MOBILE_QUERY = "(max-width: 767px)";
const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * Human-directed rework (2026-08-09), superseding Task 4.2c's keyed-cutout +
 * fired-tween design. Three changes, all from direct feedback on the built
 * result:
 *
 * 1. No more alpha key. The frames ship opaque again, with the shoot's own
 *    rgb(187,187,187) plate intact, and Hero.astro dissolves that plate into
 *    the shader field with a mask instead of cutting the artist out of it.
 *    There is no silhouette edge left anywhere to look wrong.
 * 2. No more GSAP pin and no irreversible `advanceToMusic()` tween. The hero
 *    is pinned by plain CSS `position: sticky` and Music slides up over it
 *    under ordinary scroll (Hero.astro's `.hero-scene` height + Music's
 *    negative margin). The opening intro below only drives the frame-scrub
 *    part of that real scroll position through Lenis, then yields before
 *    Music enters; it never animates Hero opacity, so the seam remains
 *    reversible whenever someone scrolls back up.
 * 3. Both breakpoints play the same footage. Mobile's separate 1176x1080
 *    shoot is gone; both sets below are crops of the same 1920x1080 master,
 *    so mobile finally reads as the same hero as desktop rather than a second
 *    one.
 *
 * The reversibility in (2) is also what fixed the reported "black when you
 * scroll back up": the old fired tween set `#hero { opacity: 0 }` and nothing
 * ever restored it, so returning to the top showed the body's own #0a0a0a.
 * Nothing animates opacity now, so there is no state left to restore.
 */

// Scroll distance the frame sequence occupies, as a fraction of viewport
// height. The old value was 45%, which was the real cause of the reported
// jerkiness: 233 frames across ~400px meant one frame per 1.7px, so an
// ordinary wheel flick skipped most of the sequence outright. At 120% with a
// 117-frame set each frame gets ~9px of travel and actually gets drawn.
// Hero.astro's `.hero-scene` height must stay in agreement with this -- see
// the note there.
const SCRUB_VH = 1.2;
// Raised from 0.35. That value was chosen to stop a very short pin feeling
// laggy; over 2.7x the distance there is room for real smoothing again, and
// this is what takes the residual step out of a fast scroll.
const SCRUB = 0.6;

// The opening move is intentionally unhurried: enough time for the first
// frame to register, then a 2.4s sweep through the existing frame-scrub
// runway. It stops on the last frame; the visitor owns the following push
// into Music. These are separate so product tuning cannot accidentally change
// the frame-scrub geometry documented above.
const AUTO_HANDOFF_DELAY_MS = 1200;
const AUTO_HANDOFF_DURATION_S = 2.4;

let autoHandoffConsumedInMemory = false;

function hasConsumedAutoHandoff(): boolean {
  return autoHandoffConsumedInMemory;
}

function consumeAutoHandoff(): void {
  autoHandoffConsumedInMemory = true;
}

interface FrameSet {
  count: number;
  path: (index: number) => string;
  /** Anchors, 0..1 per axis, for whichever axis contain-fit leaves with room
   * to spare. Desktop is height-driven (the image fills the viewport height
   * and leaves horizontal room) and anchors right, so the artist docks to the
   * screen edge -- which is also where the master frame clips him in the later
   * frames, so the clip lands on the viewport boundary and never reads as a
   * cut. Mobile is width-driven and anchors bottom. */
  anchorX?: number;
  anchorY?: number;
}

/**
 * Both sets are opaque WebP crops of the same 1920x1080 master, re-encoded
 * 2026-08-09 from the original frames recovered out of git (commit 847059b,
 * before Task 4.2b keyed and deleted them).
 *
 * WebP rather than AVIF, measured rather than assumed: AVIF is smaller on disk
 * (1.3 MB vs 1.6 MB per set) but decodes 1.5-2.5x slower for the same pixels,
 * and this sequence is decoded in full and held decoded, so time-to-scrubbable
 * is the number that matters and 300 KB against a multi-MB budget is not.
 * Full-set load+decode, 12-wide pool, same shape as loadSequence(): AVIF
 * 1.5-3.5s vs WebP 1.0-2.3s.
 *
 * Every crop deliberately keeps a wide margin of bare plate on the side that
 * faces open space -- that margin is the runway Hero.astro's mask fades out
 * over. Crop tight to the subject (as the keyed set did, at his union bounding
 * box + 4px) and there is nothing to dissolve; the mask would eat into him
 * instead.
 *
 * 117 frames, not the master's 233: every 2nd frame. Over SCRUB_VH the full
 * set would be finer-grained than the scroll can resolve, and the sequence is
 * held decoded, so the pair costs ~440MB of bitmap at 233 -- the same budget
 * the old tight-cropped set already used, spent on picture area instead of on
 * frames that never get drawn.
 */
const DESKTOP_FRAMES: FrameSet = {
  count: 117,
  // 864x1080, cropped at x=1056: ~330px of plate to the left of the artist.
  path: (i) => `/hero-frames/desktop/frame_${String(i + 1).padStart(4, "0")}.webp`,
  anchorX: 1,
};

const MOBILE_FRAMES: FrameSet = {
  count: 117,
  // 680x1080, cropped at x=1240: tighter horizontally so he reads bold at
  // phone width, full frame height so the ~190px of plate above his head
  // survives as the top fade's runway. Width-filled at 390pt/2x this draws
  // 780 device px from 680 native -- a 1.15x upscale, against the 1.56x that
  // made the old mobile shoot look soft.
  path: (i) => `/hero-frames/mobile/frame_${String(i + 1).padStart(4, "0")}.webp`,
  anchorY: 1,
};

interface DrawRect {
  dW: number;
  dH: number;
  dX: number;
  dY: number;
}

/** Where a frame lands inside the wrap, in CSS px. Always contain-fit: the
 * frames are now self-contained images rather than windows onto a larger
 * master, so there is no crop bookkeeping left, and contain is what guarantees
 * the plate margin (and therefore the fade) is never scaled off-screen the way
 * cover-fit's overflow would clip it. */
function fitFrame(set: FrameSet, wrapW: number, wrapH: number, img: HTMLImageElement): DrawRect {
  const scale = Math.min(wrapW / img.naturalWidth, wrapH / img.naturalHeight);
  const dW = img.naturalWidth * scale;
  const dH = img.naturalHeight * scale;
  return {
    dW,
    dH,
    dX: (wrapW - dW) * (set.anchorX ?? 0.5),
    dY: (wrapH - dH) * (set.anchorY ?? 0.5),
  };
}

/** DPR-capped canvas resize + fit-draw of a single image. Shared by the
 * reduced-motion static frame and setupBreakpoint's resize handler.
 *
 * The canvas is sized and positioned to the drawn frame's box rather than
 * filling the wrap, and the frame is drawn at its origin. That is what lets
 * Hero.astro's fade masks be expressed as percentages of the *footage* -- the
 * plate margin is a fixed fraction of the source crop, but it lands at a
 * different fraction of the viewport at every window size, so a mask on a
 * viewport-sized canvas could not track it. Assigning canvas.width always
 * clears the bitmap, so no explicit clear is needed here. */
function paintFrame(set: FrameSet, wrap: HTMLElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, img: HTMLImageElement): DrawRect {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = fitFrame(set, wrap.clientWidth, wrap.clientHeight, img);
  canvas.width = Math.round(rect.dW * dpr);
  canvas.height = Math.round(rect.dH * dpr);
  canvas.style.left = `${rect.dX}px`;
  canvas.style.top = `${rect.dY}px`;
  canvas.style.width = `${rect.dW}px`;
  canvas.style.height = `${rect.dH}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(img, 0, 0, rect.dW, rect.dH);
  return rect;
}

/** Walk backward from `target` to the nearest already-loaded frame (matches
 * how buffered video degrades); if nothing behind loaded yet, take the
 * nearest one ahead instead of drawing nothing. */
function nearestLoaded(images: (HTMLImageElement | null)[], target: number): number {
  for (let i = target; i >= 0; i--) if (images[i]) return i;
  for (let i = target + 1; i < images.length; i++) if (images[i]) return i;
  return -1;
}

// A pool, not "fire all at once": that was the original Task 1.3-measured
// approach, and it works fine against a real CDN, but it reliably kills two
// things this sequence is developed against. Locally, `wrangler dev`'s proxy
// worker throws "Network connection lost" partway through serving a burst
// this size and takes the whole Worker down, not just this route. And in
// headless/CI Chromium, which has no GPU and runs WebGL on a software
// rasterizer, hundreds of simultaneous decodes alongside animated shader
// canvases is enough CPU contention to stall getImageData and even
// setViewportSize. A real device has neither problem, but there's no reason to
// court them: pacing the requests costs a scroll-triggered hero a few hundred
// ms it isn't spending anyway, while it's still loading frame 0.
// ponytail: fixed pool size, not adaptive to connection speed or CPU count --
// bump MAX_CONCURRENT_LOADS if a future frame set needs more headroom.
const MAX_CONCURRENT_LOADS = 12;

/** Loads a capped number of frames at once instead of sequentially, so a slow
 * single frame can only stall the frames sharing its pool slot, not the whole
 * sequence. `onFrame` fires per settled frame (success or failure) so callers
 * can react to frame 0 without waiting for the whole set. */
function loadSequence(set: FrameSet, onFrame: (index: number, ok: boolean) => void) {
  const images: (HTMLImageElement | null)[] = new Array(set.count).fill(null);
  // The intro stops on the last frame, so load it alongside frame 0 rather
  // than making it wait behind every intermediate frame. It still never waits
  // for the whole sequence: the remaining frames keep streaming in normally.
  const order = [0, set.count - 1, ...Array.from({ length: set.count - 2 }, (_, index) => index + 1)];
  let cancelled = false;
  let next = 0;
  let active = 0;

  function launchNext() {
    while (!cancelled && active < MAX_CONCURRENT_LOADS && next < set.count) {
      const i = order[next++];
      active++;
      const img = new Image();
      img.decoding = "async";
      const settle = (ok: boolean) => {
        active--;
        if (!cancelled) {
          if (ok) images[i] = img;
          onFrame(i, ok);
          launchNext();
        }
      };
      img.onload = () => img.decode().then(() => settle(true)).catch(() => settle(true));
      img.onerror = () => settle(false);
      img.src = set.path(i);
    }
  }
  launchNext();

  return { images, cancel: () => (cancelled = true) };
}

/** One breakpoint's canvas-draw + progressive-load state. Torn down and
 * recreated whenever gsap.matchMedia's active query changes. */
function setupBreakpoint(
  set: FrameSet,
  wrap: HTMLElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  onFirstPaint: () => void,
) {
  let rect: DrawRect | null = null;
  let lastDrawn = -1;
  let lastRequested = 0;
  let hasPainted = false;
  let firstFrameSettled = false;

  function announceFirstPaint() {
    if (hasPainted) return;
    hasPainted = true;
    onFirstPaint();
  }

  function paint(target: number) {
    const idx = nearestLoaded(images, target);
    if (idx === -1 || !rect || idx === lastDrawn) return;
    lastDrawn = idx;
    // The frames are opaque again, but contain-fit still leaves real empty
    // canvas beside the drawn image at every breakpoint, and the mask in
    // Hero.astro makes the drawn edges semi-transparent on top of that --
    // without a clear each frame composites over the last and the moving
    // subject smears into a stack of ghosts. Deliberately over-covers (device
    // px measured in a DPR-scaled user space); clearRect clips, so the excess
    // is free.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(images[idx]!, 0, 0, rect.dW, rect.dH);
    canvas.dataset.frame = String(idx);
    announceFirstPaint();
  }

  function resize() {
    const refIdx = nearestLoaded(images, lastRequested);
    if (refIdx === -1) return;
    rect = paintFrame(set, wrap, canvas, ctx, images[refIdx]!);
    lastDrawn = refIdx;
    canvas.dataset.frame = String(refIdx);
    announceFirstPaint();
  }

  // `data-frame` (written here and in paint(), the only two places that draw)
  // reports which frame is actually on screen, for the e2e suite. Asserting on
  // pixels instead cannot tell "the scrub stopped early" apart from "a later
  // frame just looks similar" -- exactly the confusion this was added to
  // settle, after a headless run made a load-starved canvas look like a broken
  // scrub.

  const { images, cancel } = loadSequence(set, (index, ok) => {
    // The pooled loader can decode frame 1 before frame 0. Hold that later
    // image until frame 0 resolves so the Hero's first visible composition is
    // deterministic; only if frame 0 actually fails may nearestLoaded() use
    // an already-decoded later frame as the failure-safe poster fallback.
    if (index === 0) firstFrameSettled = true;
    if (!firstFrameSettled) return;
    if (!ok && index !== 0) return;
    if (!rect) resize();
    else paint(lastRequested);
  });

  window.addEventListener("resize", resize);

  return {
    drawTarget(frame: number) {
      lastRequested = frame;
      paint(frame);
    },
    dispose() {
      cancel();
      window.removeEventListener("resize", resize);
    },
  };
}

let heroActive = false;

/**
 * A fully interruptible opening intro. It is deliberately kept out of
 * ScrollTrigger: ScrollTrigger owns visual state *from* scroll position,
 * while this invokes one short Lenis move *to* the end of the frame scrub.
 * The visitor then owns the separate push into Music.
 */
function setupAutoHandoff(scene: HTMLElement) {
  let timer: number | undefined;
  let state: "waiting" | "pending" | "running" | "completed" | "cancelled" | "skipped" = "waiting";

  const setState = (next: typeof state) => {
    state = next;
    scene.dataset.heroAutohandoff = next;
  };

  const isAtEligibleEntryPoint = () => !window.location.hash && window.scrollY <= 1 && !document.hidden;
  const canSchedule = () => !hasConsumedAutoHandoff() && isAtEligibleEntryPoint();

  const cancel = () => {
    if (state === "completed" || state === "cancelled" || state === "skipped") return;
    if (timer !== undefined) window.clearTimeout(timer);
    timer = undefined;
    if (state === "running") cancelMotionScroll();
    // Input before the timer is a deliberate choice to take control. The
    // in-memory guard keeps a bfcache restore from replaying this document,
    // while a normal reload starts a fresh intro as requested.
    consumeAutoHandoff();
    setState("cancelled");
  };

  const onInput = () => cancel();
  const onVisibilityChange = () => {
    if (document.hidden) cancel();
  };
  const inputEvents: Array<keyof WindowEventMap> = ["pointerdown", "wheel", "touchstart", "keydown", "click"];
  for (const event of inputEvents) window.addEventListener(event, onInput, { capture: true, passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (!canSchedule()) setState("skipped");

  return {
    schedule() {
      if (state !== "waiting") return;
      if (!canSchedule()) {
        setState("skipped");
        return;
      }

      consumeAutoHandoff();
      setState("pending");
      timer = window.setTimeout(() => {
        timer = undefined;
        if (!isAtEligibleEntryPoint()) {
          setState("cancelled");
          return;
        }

        setState("running");
        const scrubEnd = scene.getBoundingClientRect().top + window.scrollY + window.innerHeight * SCRUB_VH;
        const started = scrollMotionTo(scrubEnd, {
          duration: AUTO_HANDOFF_DURATION_S,
          easing: (progress) =>
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2,
          onComplete: () => setState("completed"),
        });
        if (!started) setState("cancelled");
      }, AUTO_HANDOFF_DELAY_MS);
    },
    dispose() {
      if (timer !== undefined) window.clearTimeout(timer);
      for (const event of inputEvents) window.removeEventListener(event, onInput, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (state === "running") cancelMotionScroll();
    },
  };
}

/**
 * Guarded like lifecycle.ts's initMotionLifecycle(): re-entry while already
 * active is a no-op, and every listener this sets up (in either the
 * reduced-motion or full-scrub branch) is torn down on pagehide and
 * re-created on the next bfcache-restore pageshow -- otherwise a restored
 * page would either run with a dead engine (nothing rebuilt) or, if this
 * were called again without cleanup, duplicate resize listeners fighting an
 * old, already-collected closure's state.
 */
export function initHeroSequence(): void {
  if (heroActive) return;

  const sceneEl = document.querySelector<HTMLElement>(".hero-scene");
  const wrapEl = document.querySelector<HTMLElement>(".hero__canvas-wrap");
  const canvasEl = document.querySelector<HTMLCanvasElement>(".hero__canvas");
  const loader = document.querySelector<HTMLElement>(".hero__loader");
  if (!sceneEl || !wrapEl || !canvasEl) return;
  // Re-bound as non-nullable locals: TS's narrowing from the guard above
  // doesn't reliably survive into the functions defined further down that are
  // handed to gsap.matchMedia/ScrollTrigger as callbacks (a closure nested
  // inside another library's callback parameter), so every use past this
  // point goes through these instead of the guarded-but-still-nullable-typed
  // originals.
  const scene = sceneEl;
  const wrap = wrapEl;
  const canvas = canvasEl;
  // alpha: true -- contain-fit leaves real empty canvas area at every
  // breakpoint and the mask softens the drawn edges, so everything the frame
  // doesn't cover has to stay transparent for HeroBackdrop.astro's shader and
  // the plate glow beneath it to show through.
  const ctx2d = canvas.getContext("2d", { alpha: true });
  if (!ctx2d) return;
  const ctx = ctx2d;

  heroActive = true;
  const teardownFns: Array<() => void> = [];
  const teardown = () => {
    teardownFns.forEach((fn) => fn());
    heroActive = false;
  };

  const showLoader = () => loader?.removeAttribute("hidden");
  const hideLoader = () => loader?.setAttribute("hidden", "");

  if (!initMotionLifecycle()) {
    // Reduced motion: no scrub, just the settled final frame. The push is not
    // rebuilt in JS either -- Hero.astro only gives `.hero-scene` its extra
    // height under `[data-motion-lifecycle="active"]`, so this path leaves a
    // plain 100svh hero that ordinary scrolling leaves behind at the user's
    // own pace, with no JS involved in the handoff at all.
    const set = window.matchMedia(MOBILE_QUERY).matches ? MOBILE_FRAMES : DESKTOP_FRAMES;
    showLoader();
    const finalImg = new Image();
    finalImg.decoding = "async";
    finalImg.onload = () => {
      hideLoader();
      const draw = () => paintFrame(set, wrap, canvas, ctx, finalImg);
      draw();
      window.addEventListener("resize", draw);
      teardownFns.push(() => window.removeEventListener("resize", draw));
    };
    finalImg.onerror = hideLoader;
    finalImg.src = set.path(set.count - 1);

    window.addEventListener("pagehide", teardown, { once: true });
    return;
  }

  showLoader();
  const autoHandoff = setupAutoHandoff(scene);
  teardownFns.push(() => autoHandoff.dispose());

  /** Frames against the sticky hero's own travel. No `pin` and no pinSpacing:
   * `.hero-scene` is a tall block with a sticky child, so the browser is
   * already holding the hero in place and ScrollTrigger only has to read how
   * far through that travel we are. Ending at SCRUB_VH (rather than at the
   * scene's full height) leaves the remaining travel for Music to slide up
   * over a hero that has settled on its last frame. */
  function setupScrub(set: FrameSet) {
    const bp = setupBreakpoint(set, wrap, canvas, ctx, () => {
      hideLoader();
      autoHandoff?.schedule();
    });
    const trigger = ScrollTrigger.create({
      trigger: scene,
      start: "top top",
      end: () => `+=${window.innerHeight * SCRUB_VH}`,
      scrub: SCRUB,
      onUpdate: (self) => bp.drawTarget(Math.round(self.progress * (set.count - 1))),
    });
    return () => {
      trigger.kill();
      bp.dispose();
    };
  }

  /** Depth cue for the push, and the fix for a specific ugly frame.
   *
   * Music sweeps up over a stationary hero, so its leading edge crosses
   * whatever the hero has at that height -- on mobile that is the artist's
   * face, and a soft edge passing through it read as him sinking into the
   * moss field rather than as a transition. This recedes the hero's *content*
   * (footage and lockup, never the plate or the shader behind them) as the
   * push runs, so he has dissolved before the edge reaches him and the two
   * sections read as depth instead of collision.
   *
   * `--push` is written rather than the properties themselves so the curve
   * stays in CSS next to the layout it affects, and so this stays one
   * scroll-position-driven value with no tween state of its own: drag back up
   * and it simply reads lower again. That is the whole difference from the
   * fired opacity tween this replaced, which had no way back and left the
   * hero invisible over the body's black. */
  function setupPushRecede() {
    ScrollTrigger.create({
      trigger: scene,
      start: () => `top top-=${window.innerHeight * SCRUB_VH}`,
      end: () => `top top-=${window.innerHeight * (SCRUB_VH + 1)}`,
      scrub: true,
      onUpdate: (self) => scene.style.setProperty("--push", self.progress.toFixed(3)),
    });
    // The trigger itself is killed by ctxGsap.revert() (it is created inside
    // that context), but the inline property it writes is not -- teardown has
    // to clear it too, or a bfcache restore rebuilds the engine over a hero
    // still stuck at whatever --push the last scroll left behind.
    teardownFns.push(() => scene.style.removeProperty("--push"));
  }

  const ctxGsap = gsap.context(() => {
    const mm = gsap.matchMedia();
    mm.add(MOBILE_QUERY, () => setupScrub(MOBILE_FRAMES));
    mm.add(DESKTOP_QUERY, () => setupScrub(DESKTOP_FRAMES));
    setupPushRecede();
    ScrollTrigger.refresh();
  }, scene);
  teardownFns.push(() => ctxGsap.revert());

  window.addEventListener("pagehide", teardown, { once: true });
}

// Module-scope, registered once (see lifecycle.ts for why): rebuilds the
// whole engine after a bfcache restore, since pagehide above already tore
// it down.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) initHeroSequence();
});
