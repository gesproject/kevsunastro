const GAP = 12;
const OVERSCAN = 100;
const AMPLITUDE = 12;
const F2 = (Math.sqrt(3) - 1) / 2;
const G2 = (3 - Math.sqrt(3)) / 6;

let active = false;

function gradient(i: number, j: number, x: number, y: number) {
  let hash = (Math.imul(i, 374761393) ^ Math.imul(j, 668265263)) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177) >>> 0;
  return (hash & 1 ? x : -x) + (hash & 2 ? y : -y);
}

function simplex2D(xin: number, yin: number) {
  const skew = (xin + yin) * F2;
  const i = Math.floor(xin + skew);
  const j = Math.floor(yin + skew);
  const unskew = (i + j) * G2;
  const x0 = xin - (i - unskew);
  const y0 = yin - (j - unskew);
  const i1 = x0 > y0 ? 1 : 0;
  const j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2;
  const y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2;
  const y2 = y0 - 1 + 2 * G2;
  const corner = (x: number, y: number, column: number, row: number) => {
    const distance = 0.5 - x * x - y * y;
    return distance < 0 ? 0 : distance ** 4 * gradient(column, row, x, y);
  };
  return 70 * (corner(x0, y0, i, j) + corner(x1, y1, i + i1, j + j1) + corner(x2, y2, i + 1, j + 1));
}

/** Native canvas port of Footer's legacy simplex mesh. */
export function initFooterWaves(): void {
  if (active) return;

  const host = document.querySelector<HTMLElement>(".footer__waves");
  const footer = document.querySelector<HTMLElement>("#footer");
  if (!host || !footer) return;

  const canvas = document.createElement("canvas");
  canvas.dataset.footerWaves = "";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "display:block;width:100%;height:100%;";
  host.append(canvas);
  const context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    return;
  }

  active = true;
  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let startX = 0;
  let startY = 0;
  let cursorX = new Float32Array();
  let cursorY = new Float32Array();
  let velocityX = new Float32Array();
  let velocityY = new Float32Array();
  let frame = 0;
  let visible = true;
  const pointer = { x: -10, y: 0, sx: 0, sy: 0, lx: 0, ly: 0, speed: 0, smoothSpeed: 0, set: false };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const resize = () => {
    const rect = host.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    columns = Math.ceil((width + OVERSCAN * 2) / GAP);
    rows = Math.ceil((height + 30) / GAP);
    startX = (width - GAP * columns) / 2;
    startY = (height - GAP * rows) / 2;
    const length = columns * rows;
    cursorX = new Float32Array(length);
    cursorY = new Float32Array(length);
    velocityX = new Float32Array(length);
    velocityY = new Float32Array(length);
  };

  const draw = (time: number) => {
    context.clearRect(0, 0, width, height);
    if (pointer.set) {
      pointer.sx += (pointer.x - pointer.sx) * 0.03;
      pointer.sy += (pointer.y - pointer.sy) * 0.03;
      pointer.speed = Math.hypot(pointer.sx - pointer.lx, pointer.sy - pointer.ly);
      pointer.smoothSpeed += (pointer.speed - pointer.smoothSpeed) * 0.1;
      pointer.lx = pointer.sx;
      pointer.ly = pointer.sy;
    }
    context.strokeStyle = "rgb(200 203 200 / 11%)";
    context.lineWidth = 1;
    const phase = time * 0.00015;
    for (let column = 0; column < columns; column += 1) {
      const baseX = startX + GAP * column;
      let previousX = 0;
      let previousY = 0;
      context.beginPath();
      for (let row = 0; row < rows; row += 1) {
        const baseY = startY + GAP * row;
        const index = column * rows + row;
        const noise = simplex2D(baseX * 0.002 + phase, baseY * 0.002);
        const dx = pointer.sx - baseX;
        const dy = pointer.sy - baseY;
        const distance = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - distance / 240);
        const force = influence * influence * pointer.smoothSpeed * 0.3;
        velocityX[index] = (velocityX[index] + (dx / (distance || 1)) * force) * 0.92;
        velocityY[index] = (velocityY[index] + (dy / (distance || 1)) * force) * 0.92;
        cursorX[index] = (cursorX[index] + velocityX[index]) * 0.97;
        cursorY[index] = (cursorY[index] + velocityY[index]) * 0.97;
        const x = baseX + Math.cos(noise * Math.PI * 2) * AMPLITUDE + cursorX[index];
        const y = baseY + Math.sin(noise * Math.PI * 2) * AMPLITUDE + cursorY[index];
        if (row === 0) context.moveTo(x, y);
        else context.quadraticCurveTo(previousX, previousY, (previousX + x) / 2, (previousY + y) / 2);
        previousX = x;
        previousY = y;
      }
      context.stroke();
    }
    canvas.dataset.ready = "";
  };

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };
  const loop = (time: number) => {
    draw(time);
    frame = requestAnimationFrame(loop);
  };
  const sync = () => {
    stop();
    if (reduced.matches) draw(0);
    else if (!document.hidden && visible) frame = requestAnimationFrame(loop);
  };
  const onPointerMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    if (!pointer.set) {
      pointer.sx = pointer.x;
      pointer.sy = pointer.y;
      pointer.lx = pointer.x;
      pointer.ly = pointer.y;
      pointer.set = true;
    }
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { rootMargin: "20% 0px" });
  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!frame && (reduced.matches || visible)) draw(0);
  });

  resize();
  observer.observe(canvas);
  resizeObserver.observe(host);
  footer.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  sync();

  window.addEventListener(
    "pagehide",
    () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      footer.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      canvas.remove();
      active = false;
    },
    { once: true },
  );
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted) initFooterWaves();
});
