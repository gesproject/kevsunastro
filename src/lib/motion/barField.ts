/**
 * Vertical signal-bar field — Music section backdrop.
 *
 * Vanilla 2D-canvas port of the human-supplied "VerticalBarsNoise" React
 * component, adapted to this project the same way its moss shader was:
 * no React island on public routes, same engine lifecycle contract as
 * shaderField.ts (initBarField returns { setVisible, dispose }), identical
 * pause semantics (hidden tab / out-of-view / prefers-reduced-motion single
 * frame), and a data-ready attribute set only after the first real paint.
 *
 * Deviations from the source component, all deliberate:
 * - The canvas is TRANSPARENT. The source filled a solid background every
 *   frame; here the section's own CSS gradient floor shows through, which
 *   is what keeps the no-JS floor, the WebGL-era veil maths, and the
 *   Hero→Music seam mask working unchanged.
 * - Pointer interaction binds to the SECTION, not the canvas: the backdrop
 *   itself keeps pointer-events: none, so hovering the player cards still
 *   excites the field behind them. Click/tap ripples are kept — they read
 *   as premium without stealing any semantic action.
 * - Dark-grade palette: bone-white hairlines and bars on the dark moss
 *   floor, with sparse lime accents on noise peaks so the field speaks the
 *   same accent language as the Shows board. The source's light paper look
 *   belonged to the old light grade.
 * - Line count is capped and sampling is stepped so a very tall section
 *   cannot blow the per-frame budget.
 */

/** Tuning. Speed matches the source's default feel; palette is Sölbo's. */
const CONFIG = {
  animationSpeed: 0.0005,
  rowPitchPx: 11,
  maxRows: 96,
  sampleStepPx: 8,
  lineWidth: 1,
  /** Hairline colour: --color-text tone, very low alpha. */
  lineRGB: [245, 245, 242] as const,
  /** Bar body: warm bone white. */
  barRGB: [232, 230, 222] as const,
  /** Peak accent: --music-accent lime, used sparingly. */
  accentRGB: [163, 230, 53] as const,
  pointerRadiusPx: 200,
  rippleMaxAgeMs: 2000,
  rippleRadiusPx: 300,
};

interface Ripple {
  x: number;
  y: number;
  time: number;
  intensity: number;
}

export interface BarFieldHandle {
  setVisible(visible: boolean): void;
  dispose(): void;
}

function noise(x: number, y: number, t: number): number {
  const n =
    Math.sin(x * 0.01 + t) * Math.cos(y * 0.01 + t) +
    Math.sin(x * 0.015 - t) * Math.cos(y * 0.005 + t);
  return (n + 1) / 2;
}

export function initBarField(
  canvas: HTMLCanvasElement,
  section: HTMLElement,
): BarFieldHandle | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let dpr = 1;
  let lastDpr = 0;
  let cssWidth = 0;
  let cssHeight = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth));
    const h = Math.max(1, Math.round(canvas.clientHeight));
    if (w === cssWidth && h === cssHeight && dpr === lastDpr) return;
    cssWidth = w;
    cssHeight = h;
    lastDpr = dpr;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    // Context transform must be reset before scaling: re-setting .width
    // resets it anyway, but an explicit setTransform keeps the maths honest
    // across repeated resizes.
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const pointer = { x: -1e4, y: -1e4, isDown: false };
  const ripples: Ripple[] = [];

  function pointerInfluence(x: number, y: number): number {
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return Math.max(0, 1 - distance / CONFIG.pointerRadiusPx);
  }

  function rippleInfluence(x: number, y: number, now: number): number {
    let total = 0;
    for (const ripple of ripples) {
      const age = now - ripple.time;
      if (age >= CONFIG.rippleMaxAgeMs) continue;
      const dx = x - ripple.x;
      const dy = y - ripple.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = (age / CONFIG.rippleMaxAgeMs) * CONFIG.rippleRadiusPx;
      const band = 50;
      const delta = Math.abs(distance - radius);
      if (delta < band) {
        const strength = (1 - age / CONFIG.rippleMaxAgeMs) * ripple.intensity;
        total += strength * (1 - delta / band);
      }
    }
    return Math.min(total, 2);
  }

  function draw(seconds: number) {
    resize();
    const now = performance.now();
    // The source advanced its clock by animationSpeed per frame at ~60fps;
    // this port derives the same continuous phase from elapsed seconds.
    const t = seconds * CONFIG.animationSpeed * 60;

    // Transparent clear: the section's gradient floor shows through.
    ctx!.clearRect(0, 0, cssWidth, cssHeight);

    const rowCount = Math.min(Math.floor(cssHeight / CONFIG.rowPitchPx), CONFIG.maxRows);
    const pitch = cssHeight / rowCount;

    for (let i = 0; i < rowCount; i++) {
      const y = i * pitch + pitch / 2;
      const midPointer = pointerInfluence(cssWidth / 2, y);
      const lineAlpha = 0.05 + midPointer * 0.14;

      ctx!.beginPath();
      ctx!.strokeStyle = `rgba(${CONFIG.lineRGB[0]}, ${CONFIG.lineRGB[1]}, ${CONFIG.lineRGB[2]}, ${lineAlpha})`;
      ctx!.lineWidth = CONFIG.lineWidth + midPointer * 1.5;
      ctx!.moveTo(0, y);
      ctx!.lineTo(cssWidth, y);
      ctx!.stroke();

      for (let x = 0; x < cssWidth; x += CONFIG.sampleStepPx) {
        const value = noise(x, y, t);
        const pInfl = pointerInfluence(x, y);
        const rInfl = rippleInfluence(x, y, now);
        const influence = pInfl + rInfl;

        const threshold = Math.max(0.2, 0.5 - pInfl * 0.2 - Math.abs(rInfl) * 0.1);
        if (value <= threshold) continue;

        const barWidth = 3 + value * 10 + influence * 5;
        const barHeight = 2 + value * 3 + influence * 3;
        const baseAnimation = Math.sin(t + y * 0.0375) * 20 * value;
        const pointerAnimation = pointer.isDown ? Math.sin(t * 3 + x * 0.01) * 10 * pInfl : 0;
        const rippleAnimation = rInfl * Math.sin(t * 2 + x * 0.02) * 15;
        const animatedX = x + baseAnimation + pointerAnimation + rippleAnimation;

        // Peaks go lime, everything else stays bone — sparse by construction
        // because the threshold gate already thins the population.
        const accent = value > 0.86 && influence < 0.2;
        const rgb = accent ? CONFIG.accentRGB : CONFIG.barRGB;
        const alpha = accent ? 0.9 : Math.min(1, Math.max(0.55, 0.62 + influence * 0.3));

        ctx!.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
        ctx!.fillRect(animatedX - barWidth / 2, y - barHeight / 2, barWidth, barHeight);
      }
    }

    canvas.setAttribute("data-ready", "");
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let startTime = 0;
  let startSeconds = 0;
  let visible = true;

  function loop(now: number) {
    if (!startTime) {
      startTime = now;
      startSeconds = 0;
    }
    const seconds = startSeconds + (now - startTime) / 1000;
    draw(seconds);
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }

  function sync() {
    stop();
    if (reduced.matches) {
      // Reduced motion still gets the artwork, just frozen.
      draw(0);
    } else if (!document.hidden && visible) {
      startTime = 0;
      frame = requestAnimationFrame(loop);
    }
  }

  const onResize = () => {
    if (!frame) draw(0);
  };

  function sectionPoint(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  }
  const onPointerMove = (event: PointerEvent) => sectionPoint(event);
  const onPointerDown = (event: PointerEvent) => {
    pointer.isDown = true;
    sectionPoint(event);
    ripples.push({ x: pointer.x, y: pointer.y, time: performance.now(), intensity: 1.5 });
    const now = performance.now();
    while (ripples.length && now - ripples[0].time > CONFIG.rippleMaxAgeMs) ripples.shift();
  };
  const onPointerUp = () => {
    pointer.isDown = false;
  };

  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  window.addEventListener("resize", onResize);
  section.addEventListener("pointermove", onPointerMove);
  section.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointerup", onPointerUp);

  sync();

  return {
    setVisible(next: boolean) {
      if (next === visible) return;
      visible = next;
      sync();
    },
    dispose() {
      stop();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      window.removeEventListener("resize", onResize);
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}
