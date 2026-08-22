#!/usr/bin/env node
// Task 1.3 hero delivery benchmark runner.
// Serves the repo over a local static server (range + immutable cache + COOP/COEP),
// drives headless Edge over CDP, and records real network/decode/seek/memory numbers.
// Usage (repo root): node tasks/astro-migration/references/task-1.3/bench.mjs
import { spawn } from 'node:child_process';
import { createReadStream, statSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, normalize } from 'node:path';
import os from 'node:os';
import WebSocket from 'ws';

const repoRoot = process.cwd();
const outDir = join(repoRoot, 'tasks/astro-migration/references/task-1.3/results');
mkdirSync(outDir, { recursive: true });

const PORT = Number(process.env.BENCH_PORT || '3113');
const CDP_PORT = Number(process.env.CDP_PORT || '9345');
const BROWSER = process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const MODES = (process.env.MODES || [
  'seq-jpeg', 'seq-webp', 'seq-avif',
  'video-h264-gop30', 'video-h264-gop10', 'video-h264-allintra', 'video-vp9',
].join(',')).split(',');
// Chrome DevTools "Slow 4G" preset.
const THROTTLE = { offline: false, latency: 150, downloadThroughput: Math.round(1.6 * 1024 * 1024 / 8), uploadThroughput: Math.round(750 * 1024 / 8) };
const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.js': 'text/javascript' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------- static server ----------------
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const file = join(repoRoot, normalize(decodeURIComponent(url.pathname)).replace(/^([\\/]\.\.)+/, ''));
  if (!existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end('nope'); return; }
  const size = statSync(file).size;
  const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
  const base = {
    'Content-Type': type,
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Accept-Ranges': 'bytes',
    'Cache-Control': extname(file) === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    'ETag': `"${size}-${statSync(file).mtimeMs}"`,
  };
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : size - 1;
    res.writeHead(206, { ...base, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...base, 'Content-Length': size });
  createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(PORT, '127.0.0.1', r));

// ---------------- browser + CDP ----------------
if (!existsSync(BROWSER)) throw new Error('Browser not found: ' + BROWSER);
const profileDir = join(process.env.LOCALTEMP || os.tmpdir(), 'task13-bench-' + Date.now());
rmSync(profileDir, { recursive: true, force: true }); mkdirSync(profileDir, { recursive: true });
const browser = spawn(BROWSER, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-sync', '--remote-allow-origins=*',
  '--autoplay-policy=no-user-gesture-required',
  `--remote-debugging-port=${CDP_PORT}`, `--user-data-dir=${profileDir}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });

class CDP {
  constructor(ws) { this.ws = ws; this.id = 1; this.pending = new Map(); this.handlers = new Map(); }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res, { once: true }); ws.addEventListener('error', e => rej(new Error(e.message || 'ws error')), { once: true }); });
    const c = new CDP(ws);
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id) { const p = c.pending.get(m.id); if (p) { c.pending.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result || {}); } return; }
      for (const h of c.handlers.get(m.method) || []) h(m.params || {});
    });
    return c;
  }
  on(method, h) { if (!this.handlers.has(method)) this.handlers.set(method, []); this.handlers.get(method).push(h); }
  send(method, params = {}) {
    const id = this.id++;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.delete(id)) rej(new Error('CDP timeout ' + method)); }, 300000);
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

async function cdpVersion() {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    try { const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`); if (r.ok) return r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('browser CDP never came up');
}
const version = await cdpVersion();
const browserCdp = await CDP.connect(version.webSocketDebuggerUrl);

const MEDIA_RE = /frames-mobile|task-1\.3\/assets/;

async function runOnce({ mode, fail = false, throttle = true, warm = false }) {
  const { targetId } = await browserCdp.send('Target.createTarget', { url: 'about:blank' });
  const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
  const page = await CDP.connect(list.find(t => t.id === targetId).webSocketDebuggerUrl);
  const reqUrl = new Map(), bytes = new Map(), streamed = new Map(), fromCache = new Set(), statuses = new Map();
  page.on('Network.requestWillBeSent', p => reqUrl.set(p.requestId, p.request.url));
  page.on('Network.responseReceived', p => { statuses.set(p.requestId, p.response.status); if (p.response.fromDiskCache || p.response.fromPrefetchCache) fromCache.add(p.requestId); });
  page.on('Network.requestServedFromCache', p => fromCache.add(p.requestId));
  page.on('Network.loadingFinished', p => bytes.set(p.requestId, p.encodedDataLength));
  // Media range requests can still be streaming when the harness finishes, so loadingFinished
  // never fires for them. Accumulate per-chunk bytes too and take whichever is larger.
  page.on('Network.dataReceived', p => streamed.set(p.requestId, (streamed.get(p.requestId) || 0) + p.encodedDataLength));

  await page.send('Network.enable');
  await page.send('Page.enable');
  await page.send('Performance.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await page.send('Network.setCacheDisabled', { cacheDisabled: !warm });
  await page.send('Network.emulateNetworkConditions', throttle ? THROTTLE : { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  const url = `http://127.0.0.1:${PORT}/tasks/astro-migration/references/task-1.3/harness.html?mode=${mode}${fail ? '&fail=1' : ''}`;
  if (warm) { // prime the cache with an identical uncounted load
    await page.send('Page.navigate', { url });
    await waitForBench(page, 240000);
    reqUrl.clear(); bytes.clear(); fromCache.clear(); statuses.clear();
    await page.send('Page.navigate', { url: 'about:blank' });
    await sleep(300);
  }
  await page.send('Page.navigate', { url });
  const bench = await waitForBench(page, 300000);
  const metrics = (await page.send('Performance.getMetrics')).metrics.reduce((a, m) => (a[m.name] = m.value, a), {});
  const processMemory = await browserProcessMemory();

  let mediaBytes = 0, mediaReqs = 0, cachedReqs = 0, cachedButCounted = 0, stillStreaming = 0;
  for (const [id, u] of reqUrl) {
    if (!MEDIA_RE.test(u)) continue;
    const b = Math.max(bytes.get(id) || 0, streamed.get(id) || 0);
    if (!bytes.has(id) && streamed.has(id)) stillStreaming++;
    mediaReqs++; mediaBytes += b;
    if (fromCache.has(id)) { cachedReqs++; cachedButCounted += b; }
  }
  const statusCounts = {};
  for (const [id, s] of statuses) if (MEDIA_RE.test(reqUrl.get(id) || '')) statusCounts[s] = (statusCounts[s] || 0) + 1;

  await page.send('Target.closeTarget', { targetId }).catch(() => {});
  page.close();
  return {
    run: { mode, fail, throttle, warm },
    cdp: { mediaRequests: mediaReqs, mediaEncodedBytes: mediaBytes, servedFromCache: cachedReqs, cachedEncodedBytes: cachedButCounted, stillStreamingAtEnd: stillStreaming, statusCounts },
    perf: { jsHeapUsedBytes: metrics.JSHeapUsedSize, documents: metrics.Documents, nodes: metrics.Nodes, taskDurationS: metrics.TaskDuration },
    processMemory,
    page: bench,
  };
}

// Decoded-image residency lives outside the JS heap, so sample the isolated browser's
// real OS working set instead of pretending JSHeapUsedSize covers it.
async function browserProcessMemory() {
  try {
    const info = await browserCdp.send('SystemInfo.getProcessInfo');
    const ids = info.processInfo.map(p => p.id);
    const out = await new Promise((res, rej) => {
      const ps = spawn('powershell.exe', ['-NoProfile', '-Command',
        `Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Select-Object Id,WorkingSet64 | ConvertTo-Json -Compress`], { windowsHide: true });
      let buf = ''; ps.stdout.on('data', d => buf += d); ps.on('close', () => res(buf.trim())); ps.on('error', rej);
    });
    const rows = out ? [].concat(JSON.parse(out)) : [];
    const byId = new Map(rows.map(r => [r.Id, r.WorkingSet64]));
    const perType = {};
    let total = 0;
    for (const p of info.processInfo) {
      const ws = byId.get(p.id) || 0;
      perType[p.type] = (perType[p.type] || 0) + ws;
      total += ws;
    }
    return { totalWorkingSetBytes: total, byType: perType, processCount: info.processInfo.length };
  } catch (e) { return { error: e.message }; }
}

async function waitForBench(page, budgetMs) {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    const r = await page.send('Runtime.evaluate', { expression: 'window.__bench ? JSON.stringify(window.__bench) : null', returnByValue: true }).catch(() => null);
    const v = r?.result?.value;
    if (v) return JSON.parse(v);
    await sleep(500);
  }
  throw new Error('harness never published window.__bench');
}

// ---------------- run matrix ----------------
const results = [];
const plan = [];
for (const mode of MODES) {
  plan.push({ mode, throttle: true });                 // cold, Slow 4G
  plan.push({ mode, throttle: false });                // cold, loopback (task 0.3 comparable)
  plan.push({ mode, throttle: false, warm: true });    // warm cache
}
plan.push({ mode: 'seq-jpeg', fail: true, throttle: false });
plan.push({ mode: 'video-h264-gop10', fail: true, throttle: false });

for (const p of plan) {
  const label = `${p.mode}${p.fail ? '+fail' : ''}${p.warm ? '+warm' : p.throttle ? '+slow4g' : '+loopback'}`;
  process.stdout.write('running ' + label + ' ... ');
  try { const r = await runOnce(p); results.push(r); console.log('ok', r.cdp.mediaRequests, 'req', r.cdp.mediaEncodedBytes, 'B'); }
  catch (e) { results.push({ run: p, error: e.message }); console.log('FAILED', e.message); }
}

writeFileSync(join(outDir, 'bench-results.json'), JSON.stringify({ capturedAt: new Date().toISOString(), browser: version.Browser, throttleProfile: THROTTLE, results }, null, 2));
console.log('wrote results/bench-results.json');
browserCdp.close(); browser.kill(); server.close();
try { rmSync(profileDir, { recursive: true, force: true }); } catch {} // browser may still hold the profile
process.exit(0);
