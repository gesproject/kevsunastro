const SOURCES = {
  desktop: { label: "Desktop master / wide source", directory: "assets/desktop", count: 233 },
  mobile: { label: "Mobile companion / close source", directory: "assets/mobile", count: 193 },
};

const MAX_DECODED_FRAMES = 32;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopQuery = window.matchMedia("(min-width: 768px)");
const canvas = document.querySelector("#hero-canvas");
const stage = document.querySelector("#stage");
const scrub = document.querySelector("#scrub");
const sourceLabel = document.querySelector("#source-label");
const status = document.querySelector("#status");
const frameCount = document.querySelector("#frame-count");
const cacheCount = document.querySelector("#cache-count");
const failureToggle = document.querySelector("#failure-toggle");
const context = canvas.getContext("2d", { alpha: false });

let source = desktopQuery.matches ? SOURCES.desktop : SOURCES.mobile;
let cache = new Map();
let pending = new Map();
let requestedFrame = 0;
let failed = false;
let raf = 0;
let poster = null;
let sourceGeneration = 0;

function framePath(index) {
  return `${source.directory}/frame_${String(index + 1).padStart(4, "0")}.avif`;
}

function updateMeta() {
  sourceLabel.textContent = source.label;
  scrub.max = String(source.count - 1);
  scrub.value = String(Math.min(requestedFrame, source.count - 1));
  frameCount.textContent = `Frame ${Math.min(requestedFrame, source.count - 1) + 1} / ${source.count}`;
  cacheCount.textContent = `${cache.size} frames cached`;
}

function fitCanvas() {
  const bounds = stage.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(bounds.width * dpr));
  canvas.height = Math.max(1, Math.round(bounds.height * dpr));
  canvas.style.width = `${bounds.width}px`;
  canvas.style.height = `${bounds.height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawClosestFrame(requestedFrame);
}

function drawCover(image) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.fillStyle = "#c8cbc8";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function cacheFrame(index, image) {
  cache.delete(index);
  cache.set(index, image);
  while (cache.size > MAX_DECODED_FRAMES) {
    cache.delete(cache.keys().next().value);
  }
  updateMeta();
}

function loadFrame(index) {
  const safeIndex = Math.max(0, Math.min(source.count - 1, index));
  const generation = sourceGeneration;
  const path = framePath(safeIndex);
  if (cache.has(safeIndex)) {
    const image = cache.get(safeIndex);
    cache.delete(safeIndex);
    cache.set(safeIndex, image);
    return Promise.resolve(image);
  }
  if (pending.has(safeIndex)) return pending.get(safeIndex);

  const request = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
        if (generation === sourceGeneration) cacheFrame(safeIndex, image);
        resolve(image);
      } catch (error) {
        reject(error);
      } finally {
        pending.delete(safeIndex);
      }
    };
    image.onerror = () => {
      pending.delete(safeIndex);
      reject(new Error(`Could not load ${path}`));
    };
    image.src = path;
  });

  pending.set(safeIndex, request);
  return request;
}

function closestCached(index) {
  if (cache.has(index)) return cache.get(index);
  const available = [...cache.keys()];
  if (!available.length) return null;
  const nearest = available.reduce((best, candidate) =>
    Math.abs(candidate - index) < Math.abs(best - index) ? candidate : best
  );
  return cache.get(nearest);
}

function drawClosestFrame(index) {
  const image = failed ? poster : closestCached(index) || poster;
  if (image) drawCover(image);
}

function scheduleProgressiveLoads(from) {
  const nearby = [-2, -1, 1, 2, -5, 5, -12, 12]
    .map(offset => from + offset)
    .filter(index => index >= 0 && index < source.count);
  const coarse = Array.from({ length: 12 }, (_, step) => Math.round((source.count - 1) * (step / 11)));
  const queue = [...new Set([from, source.count - 1, ...nearby, ...coarse])];
  queue.forEach(index => loadFrame(index).then(() => drawClosestFrame(requestedFrame)).catch(() => {
    status.textContent = "A frame failed. The final poster remains available; scrolling is unchanged.";
  }));
}

function setFrame(index, reason = "Scrubbing") {
  requestedFrame = Math.max(0, Math.min(source.count - 1, Math.round(index)));
  updateMeta();
  if (reduceMotion.matches || failed) {
    drawClosestFrame(source.count - 1);
    return;
  }
  status.textContent = `${reason}: AVIF frame ${requestedFrame + 1} of ${source.count}`;
  loadFrame(requestedFrame)
    .then(() => drawClosestFrame(requestedFrame))
    .catch(() => {
      status.textContent = "Frame unavailable. Showing the poster; native scrolling stays available.";
      drawClosestFrame(source.count - 1);
    });
  scheduleProgressiveLoads(requestedFrame);
}

function resetSource() {
  source = desktopQuery.matches ? SOURCES.desktop : SOURCES.mobile;
  cache = new Map();
  pending = new Map();
  poster = null;
  sourceGeneration += 1;
  requestedFrame = 0;
  failed = false;
  failureToggle.textContent = "Simulate media failure";
  updateMeta();
  status.textContent = `Loading ${source.label.toLowerCase()} poster…`;
  loadFrame(source.count - 1)
    .then(image => {
      poster = image;
      drawClosestFrame(source.count - 1);
      if (reduceMotion.matches) {
        status.textContent = "Reduced motion: final-frame poster. Native scrolling remains available.";
        return;
      }
      status.textContent = "Poster ready. Scroll or scrub; frames load progressively.";
      setFrame(0, "Ready");
    })
    .catch(() => {
      status.textContent = "Poster failed to load. Native scrolling remains available.";
    });
}

scrub.addEventListener("input", event => setFrame(Number(event.target.value)));
failureToggle.addEventListener("click", () => {
  failed = !failed;
  failureToggle.textContent = failed ? "Restore sequence" : "Simulate media failure";
  status.textContent = failed
    ? "Simulated failure: final-frame poster only. Native scrolling remains available."
    : "Sequence restored. Scroll or scrub to request frames.";
  drawClosestFrame(failed ? source.count - 1 : requestedFrame);
});

window.addEventListener("scroll", () => {
  if (reduceMotion.matches || failed || raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const bounds = stage.getBoundingClientRect();
    const distance = Math.max(1, stage.parentElement.offsetHeight - window.innerHeight);
    const consumed = Math.max(0, Math.min(distance, -bounds.top));
    setFrame((consumed / distance) * (source.count - 1), "Scroll scrubbing");
  });
}, { passive: true });

window.addEventListener("resize", fitCanvas, { passive: true });
desktopQuery.addEventListener("change", resetSource);
reduceMotion.addEventListener("change", resetSource);

fitCanvas();
resetSource();
