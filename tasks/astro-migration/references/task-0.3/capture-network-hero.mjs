#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import WebSocket from 'ws';

const repoRoot = process.cwd();
const outDir = join(repoRoot, 'tasks/astro-migration/references/task-0.3');
mkdirSync(outDir, { recursive: true });

const targetUrl = process.env.TARGET_URL || 'http://127.0.0.1:3003/';
const runLabel = process.env.RUN_LABEL || 'network-hero-mobile-cold';
const cdpPort = Number(process.env.CDP_PORT || '9333');
const cdpHost = process.env.CDP_HOST || '127.0.0.1';
const remoteDebuggingAddress = process.env.REMOTE_DEBUGGING_ADDRESS || '127.0.0.1';
const isWindows = process.platform === 'win32';
const browserPath = process.env.CHROME_PATH || (isWindows
  ? 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  : '/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
const blockPattern = process.env.BLOCK_PATTERN || '';
const HERO_FRAME_PATH = /^\/frames-mobile\/frame_\d{4}\.jpg$/i;
const HERO_FRAME_COUNT = 193;
const viewport = {
  width: Number(process.env.VIEWPORT_WIDTH || '375'),
  height: Number(process.env.VIEWPORT_HEIGHT || '812'),
  deviceScaleFactor: Number(process.env.DEVICE_SCALE_FACTOR || '1'),
  mobile: true,
};
const waitBudgetMs = Number(process.env.WAIT_BUDGET_MS || '120000');

if (!existsSync(browserPath)) {
  throw new Error(`Browser executable not found: ${browserPath}`);
}

const windowsTempRoot = '/mnt/c/Users/Chance/AppData/Local/Temp';
const profileRoot = process.env.EDGE_PROFILE_ROOT || (isWindows ? (process.env.LOCALTEMP || os.tmpdir()) : (existsSync(windowsTempRoot) ? windowsTempRoot : os.tmpdir()));
const profileDir = join(profileRoot, `${runLabel}-edge-profile-${Date.now()}`);
rmSync(profileDir, { recursive: true, force: true });
mkdirSync(profileDir, { recursive: true });
const profileForBrowser = isWindows ? profileDir : execFileSync('wslpath', ['-w', profileDir], { encoding: 'utf8' }).trim();

const edgeArgs = [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-sync',
  '--disable-features=Translate,MediaRouter,OptimizationHints',
  '--remote-allow-origins=*',
  `--remote-debugging-address=${remoteDebuggingAddress}`,
  `--remote-debugging-port=${cdpPort}`,
  `--user-data-dir=${profileForBrowser}`,
  'about:blank',
];

const browserProcess = spawn(browserPath, edgeArgs, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
let browserStdout = '';
let browserStderr = '';
browserProcess.stdout.on('data', (chunk) => { browserStdout += chunk.toString(); });
browserProcess.stderr.on('data', (chunk) => { browserStderr += chunk.toString(); });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJsonVersion() {
  const deadline = Date.now() + 45000;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://${cdpHost}:${cdpPort}/json/version`);
      if (response.ok) return await response.json();
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error.message;
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for browser CDP on port ${cdpPort}: ${lastError}`);
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 1;
    this.pending = new Map();
    this.handlers = new Map();
  }
  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket open timeout')), 15000);
      this.ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.ws.addEventListener('error', (event) => { clearTimeout(timer); reject(new Error(`WebSocket error: ${event.message || 'unknown'}`)); }, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const callbacks = this.pending.get(message.id);
        if (callbacks) {
          this.pending.delete(message.id);
          if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
          else callbacks.resolve(message.result || {});
        }
        return;
      }
      const handlers = this.handlers.get(message.method) || [];
      for (const handler of handlers) handler(message.params || {});
    });
  }
  on(method, handler) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(handler);
  }
  send(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP command timeout: ${method}`));
        }
      }, 30000);
    });
  }
  close() {
    try { this.ws?.close(); } catch {}
  }
}

function csvEscape(value) {
  const string = String(value ?? '');
  if (/[",\n]/.test(string)) return `"${string.replaceAll('"', '""')}"`;
  return string;
}

function evaluationValue(response) {
  if (response.exceptionDetails) {
    const detail = response.exceptionDetails;
    throw new Error(`Runtime.evaluate failed: ${detail.text || 'unknown error'} ${detail.exception?.description || ''}`.trim());
  }
  const value = response.result?.value;
  return typeof value === 'string' ? JSON.parse(value) : (value || null);
}

function isFirstParty(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
  } catch {
    return false;
  }
}

function hostOf(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

function pathOf(url) {
  try { return new URL(url).pathname; } catch { return url; }
}

function classifyKind(request) {
  const path = pathOf(request.url).toLowerCase();
  if (request.type === 'Document') return 'document';
  if (request.type === 'Script' || path.endsWith('.js')) return 'js';
  if (request.type === 'Stylesheet' || path.endsWith('.css')) return 'css';
  if (request.type === 'Font' || /\.(woff2?|ttf|otf|eot)$/.test(path)) return 'font';
  if (request.type === 'Media' || /\.(mp4|webm|mp3|m4a|wav|ogg)$/.test(path)) return 'media';
  if (request.type === 'Image' || /\.(jpe?g|png|webp|gif|svg|avif|ico)$/.test(path)) return 'image';
  if (request.type === 'Fetch' || request.type === 'XHR') return 'data';
  return (request.type || 'other').toLowerCase();
}

function summarize(requests, heroFrameNetworkCompleteAtMs) {
  const rows = [...requests.values()].map((request) => {
    const encoded = request.encodedDataLength ?? request.encodedDataFromChunks ?? request.responseEncodedDataLength ?? 0;
    const endMs = request.endTs && request.navStartTs ? (request.endTs - request.navStartTs) * 1000 : null;
    const startMs = request.startTs && request.navStartTs ? (request.startTs - request.navStartTs) * 1000 : 0;
    return {
      id: request.id,
      url: request.url,
      host: hostOf(request.url),
      path: pathOf(request.url),
      method: request.method,
      type: request.type,
      kind: classifyKind(request),
      firstParty: isFirstParty(request.url),
      thirdPartyPlayer: /(^|\.)spotify\.com$|(^|\.)scdn\.co$|(^|\.)soundcloud\.com$|(^|\.)sndcdn\.com$/i.test(hostOf(request.url)),
      status: request.status ?? null,
      mimeType: request.mimeType ?? '',
      protocol: request.protocol ?? '',
      contentEncoding: request.contentEncoding ?? '',
      fromDiskCache: Boolean(request.fromDiskCache),
      failed: Boolean(request.failed),
      errorText: request.errorText || '',
      startMs,
      endMs,
      durationMs: endMs == null ? null : endMs - startMs,
      encodedDataLength: encoded,
      dataLength: request.dataLength ?? 0,
      initiatorType: request.initiatorType || '',
      initialBeforeHeroFrameNetworkComplete: heroFrameNetworkCompleteAtMs == null ? null : (endMs != null && endMs <= heroFrameNetworkCompleteAtMs + 1),
    };
  }).sort((a, b) => a.startMs - b.startMs || a.url.localeCompare(b.url));

  const groups = {};
  for (const row of rows) {
    const owner = row.firstParty ? 'firstParty' : row.thirdPartyPlayer ? 'thirdPartyPlayer' : 'otherThirdParty';
    const phase = row.initialBeforeHeroFrameNetworkComplete ? 'initialToHeroFrameNetworkComplete' : 'afterHeroFrameNetworkCompleteOrUnbounded';
    for (const key of [`${owner}:${row.kind}`, `${owner}:all`, `${phase}:${owner}:${row.kind}`, `${phase}:${owner}:all`]) {
      if (!groups[key]) groups[key] = { requests: 0, encodedBytes: 0, failed: 0 };
      groups[key].requests += 1;
      groups[key].encodedBytes += row.encodedDataLength || 0;
      groups[key].failed += row.failed ? 1 : 0;
    }
  }

  const heroFrames = rows.filter((row) => row.firstParty && HERO_FRAME_PATH.test(row.path));
  const finishedHeroFrames = heroFrames.filter((row) => !row.failed && row.endMs != null);
  const initialHeroFrames = heroFrames.filter((row) => row.initialBeforeHeroFrameNetworkComplete);
  return {
    totalRequests: rows.length,
    failedRequests: rows.filter((row) => row.failed).length,
    groups,
    heroFrames: {
      expected: HERO_FRAME_COUNT,
      requested: heroFrames.length,
      finished: finishedHeroFrames.length,
      failed: heroFrames.filter((row) => row.failed).length,
      encodedBytes: heroFrames.reduce((sum, row) => sum + (row.encodedDataLength || 0), 0),
      initialToHeroFrameNetworkCompleteRequests: initialHeroFrames.length,
      initialToHeroFrameNetworkCompleteEncodedBytes: initialHeroFrames.reduce((sum, row) => sum + (row.encodedDataLength || 0), 0),
      firstUrl: heroFrames[0]?.url || null,
      lastFinishedMs: Math.max(0, ...finishedHeroFrames.map((row) => row.endMs || 0)),
      firstTen: heroFrames.slice(0, 10).map((row) => ({ startMs: row.startMs, endMs: row.endMs, encodedDataLength: row.encodedDataLength, path: row.path, failed: row.failed, errorText: row.errorText })),
      lastTen: heroFrames.slice(-10).map((row) => ({ startMs: row.startMs, endMs: row.endMs, encodedDataLength: row.encodedDataLength, path: row.path, failed: row.failed, errorText: row.errorText })),
    },
    rows,
  };
}

let client;
let pageClient;
let browserVersion = null;
const requests = new Map();
let navStartTs = null;
let domContentMs = null;
let loadEventMs = null;
let lifecycleNetworkIdleMs = null;
const consoleEvents = [];
const runtimeExceptions = [];
const logEntries = [];
let heroFrameNetworkCompleteAtMs = null;
let heroFrameNetworkCompleteReason = 'not reached';

try {
  browserVersion = await waitForJsonVersion();
  const newTargetResponse = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  if (!newTargetResponse.ok) throw new Error(`Could not create CDP page: ${newTargetResponse.status} ${newTargetResponse.statusText}`);
  const target = await newTargetResponse.json();
  pageClient = new CDPClient(target.webSocketDebuggerUrl);
  await pageClient.open();

  pageClient.on('Network.requestWillBeSent', (params) => {
    if (!navStartTs && params.type === 'Document' && params.documentURL === targetUrl) navStartTs = params.timestamp;
    const existing = requests.get(params.requestId) || {};
    requests.set(params.requestId, {
      ...existing,
      id: params.requestId,
      url: params.request.url,
      method: params.request.method,
      startTs: params.timestamp,
      navStartTs: navStartTs || params.timestamp,
      type: params.type,
      initiatorType: params.initiator?.type || '',
    });
  });
  pageClient.on('Network.responseReceived', (params) => {
    const existing = requests.get(params.requestId) || { id: params.requestId };
    const headers = params.response.headers || {};
    const contentEncoding = headers['content-encoding'] || headers['Content-Encoding'] || '';
    requests.set(params.requestId, {
      ...existing,
      navStartTs: navStartTs || existing.navStartTs || params.timestamp,
      responseTs: params.timestamp,
      type: existing.type || params.type,
      status: params.response.status,
      mimeType: params.response.mimeType,
      protocol: params.response.protocol,
      fromDiskCache: params.response.fromDiskCache,
      responseEncodedDataLength: params.response.encodedDataLength,
      contentEncoding,
    });
  });
  pageClient.on('Network.dataReceived', (params) => {
    const existing = requests.get(params.requestId) || { id: params.requestId };
    requests.set(params.requestId, {
      ...existing,
      dataLength: (existing.dataLength || 0) + (params.dataLength || 0),
      encodedDataFromChunks: (existing.encodedDataFromChunks || 0) + (params.encodedDataLength || 0),
    });
  });
  pageClient.on('Network.loadingFinished', (params) => {
    const existing = requests.get(params.requestId) || { id: params.requestId };
    requests.set(params.requestId, {
      ...existing,
      navStartTs: navStartTs || existing.navStartTs || params.timestamp,
      endTs: params.timestamp,
      encodedDataLength: params.encodedDataLength,
    });
  });
  pageClient.on('Network.loadingFailed', (params) => {
    const existing = requests.get(params.requestId) || { id: params.requestId };
    requests.set(params.requestId, {
      ...existing,
      navStartTs: navStartTs || existing.navStartTs || params.timestamp,
      endTs: params.timestamp,
      failed: true,
      errorText: params.errorText,
      canceled: params.canceled,
      type: existing.type || params.type,
    });
  });
  pageClient.on('Page.domContentEventFired', (params) => { if (navStartTs) domContentMs = (params.timestamp - navStartTs) * 1000; });
  pageClient.on('Page.loadEventFired', (params) => { if (navStartTs) loadEventMs = (params.timestamp - navStartTs) * 1000; });
  pageClient.on('Page.lifecycleEvent', (params) => {
    if (params.name === 'networkIdle' && navStartTs) lifecycleNetworkIdleMs = (params.timestamp - navStartTs) * 1000;
  });
  pageClient.on('Runtime.consoleAPICalled', (params) => {
    consoleEvents.push({ type: params.type, timestamp: params.timestamp, args: (params.args || []).map((arg) => arg.value ?? arg.description ?? arg.type) });
  });
  pageClient.on('Runtime.exceptionThrown', (params) => runtimeExceptions.push(params.exceptionDetails));
  pageClient.on('Log.entryAdded', (params) => logEntries.push(params.entry));

  await pageClient.send('Page.enable');
  await pageClient.send('Page.setLifecycleEventsEnabled', { enabled: true });
  await pageClient.send('Network.enable', { maxTotalBufferSize: 100000000, maxResourceBufferSize: 10000000 });
  await pageClient.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (blockPattern) await pageClient.send('Network.setBlockedURLs', { urls: [blockPattern] });
  await pageClient.send('Runtime.enable');
  await pageClient.send('Log.enable');
  await pageClient.send('Emulation.setDeviceMetricsOverride', viewport);
  await pageClient.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  const startWall = new Date().toISOString();
  await pageClient.send('Page.navigate', { url: targetUrl });

  const waitStart = Date.now();
  while (Date.now() - waitStart < waitBudgetMs) {
    const provisional = summarize(requests, heroFrameNetworkCompleteAtMs);
    const heroFrames = provisional.heroFrames;
    if (!blockPattern && heroFrames.finished === HERO_FRAME_COUNT && heroFrames.requested === HERO_FRAME_COUNT) {
      heroFrameNetworkCompleteAtMs = heroFrames.lastFinishedMs;
      heroFrameNetworkCompleteReason = 'observed all 193 exact /frames-mobile/frame_####.jpg requests complete; this is network completion, not img.decode()/framesReady application readiness';
      break;
    }
    if (blockPattern && Date.now() - waitStart > 30000) {
      heroFrameNetworkCompleteReason = 'blocked-frame probe timed out after 30s without all 193 exact hero-frame requests completing';
      break;
    }
    await sleep(250);
  }
  if (!heroFrameNetworkCompleteAtMs && !blockPattern) {
    const provisional = summarize(requests, null);
    heroFrameNetworkCompleteReason = `timeout after ${waitBudgetMs}ms; completed exact hero frames=${provisional.heroFrames.finished}; requested exact hero frames=${provisional.heroFrames.requested}`;
  }

  await sleep(1000);
  const readinessDom = await pageClient.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `JSON.stringify((() => ({
      url: location.href,
      readyState: document.readyState,
      title: document.title,
      scrollY: window.scrollY,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      bodyTextSample: document.body.innerText.slice(0, 1000),
      canvasCount: document.querySelectorAll('canvas').length,
      imageElements: document.images.length,
      iframeElements: document.querySelectorAll('iframe').length,
      seeWebsiteControls: [...document.querySelectorAll('a,button,[role="button"]')].filter((el) => /See website/i.test(el.textContent || '')).map((el) => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 120), disabled: Boolean(el.disabled), ariaDisabled: el.getAttribute('aria-disabled') })),
      performanceResourceCount: performance.getEntriesByType('resource').length,
      heroFramePerformanceResources: performance.getEntriesByType('resource').filter((entry) => {
        const path = new URL(entry.name).pathname;
        return path.startsWith('/frames-mobile/frame_') && path.endsWith('.jpg');
      }).length,
    }))())`,
  });

  const screenshot = await pageClient.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const screenshotPath = join(outDir, `${runLabel}-screenshot.png`);
  writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));

  let entryClick = null;
  let afterScrollDom = null;
  if (!blockPattern) {
    entryClick = await pageClient.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `JSON.stringify((() => {
        const control = [...document.querySelectorAll('a,button,[role="button"]')].find((el) => /See website/i.test(el.textContent || ''));
        if (!control) return { clicked: false, reason: 'See website control not found' };
        control.click();
        return { clicked: true, tag: control.tagName, text: (control.textContent || '').trim().slice(0, 120) };
      })())`,
    });
    await sleep(4000);
    await pageClient.send('Runtime.evaluate', { expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });` });
    await sleep(8000);
    afterScrollDom = await pageClient.send('Runtime.evaluate', {
      returnByValue: true,
      expression: `JSON.stringify((() => ({
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        iframeElements: document.querySelectorAll('iframe').length,
        iframeSrcs: [...document.querySelectorAll('iframe')].map((iframe) => iframe.src),
        bodyTextSample: document.body.innerText.slice(0, 1000),
        performanceResourceCount: performance.getEntriesByType('resource').length,
        heroFramePerformanceResources: performance.getEntriesByType('resource').filter((entry) => {
          const path = new URL(entry.name).pathname;
          return path.startsWith('/frames-mobile/frame_') && path.endsWith('.jpg');
        }).length,
      }))())`,
    });
  }

  const finalSummary = summarize(requests, heroFrameNetworkCompleteAtMs);
  const replayCommand = isWindows
    ? `$env:TARGET_URL='${targetUrl}'; $env:RUN_LABEL='${runLabel}'; $env:CDP_PORT='${cdpPort}'; node tasks/astro-migration/references/task-0.3/capture-network-hero.mjs`
    : `TARGET_URL=${targetUrl} RUN_LABEL=${runLabel} CDP_PORT=${cdpPort} CHROME_PATH=${browserPath} node tasks/astro-migration/references/task-0.3/capture-network-hero.mjs`;
  const result = {
    profile: {
      command: replayCommand,
      targetUrl,
      runLabel,
      dateStartUtc: startWall,
      dateEndUtc: new Date().toISOString(),
      host: os.hostname(),
      platform: `${os.type()} ${os.release()} ${os.arch()}`,
      node: process.version,
      browserPath,
      browserVersion,
      edgeArgs,
      cacheProfile: 'fresh temporary Edge user-data-dir plus CDP Network.setCacheDisabled(true)',
      viewport,
      networkProfile: 'no CDP network emulation/throttling; local loopback 127.0.0.1:3003',
      blockPattern: blockPattern || null,
      waitBudgetMs,
    },
    timingsMs: {
      domContent: domContentMs,
      loadEvent: loadEventMs,
      lifecycleNetworkIdle: lifecycleNetworkIdleMs,
      heroFrameNetworkComplete: heroFrameNetworkCompleteAtMs,
      heroFrameNetworkCompleteReason,
    },
    dom: {
      readiness: evaluationValue(readinessDom),
      entryClick: entryClick ? evaluationValue(entryClick) : null,
      afterScroll: afterScrollDom ? evaluationValue(afterScrollDom) : null,
    },
    console: {
      consoleEvents,
      runtimeExceptions,
      logEntries,
    },
    summary: finalSummary,
    browserProcess: {
      stdout: browserStdout.slice(-4000),
      stderr: browserStderr.slice(-8000),
    },
    artifacts: {
      json: `tasks/astro-migration/references/task-0.3/${runLabel}.json`,
      waterfallCsv: `tasks/astro-migration/references/task-0.3/${runLabel}-waterfall.csv`,
      screenshot: `tasks/astro-migration/references/task-0.3/${runLabel}-screenshot.png`,
    },
  };

  const jsonPath = join(outDir, `${runLabel}.json`);
  writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  const csvHeader = ['startMs', 'endMs', 'durationMs', 'initialBeforeHeroFrameNetworkComplete', 'firstParty', 'thirdPartyPlayer', 'kind', 'type', 'status', 'failed', 'encodedDataLength', 'contentEncoding', 'host', 'path', 'url'];
  const csvRows = finalSummary.rows.map((row) => csvHeader.map((key) => csvEscape(row[key])).join(','));
  writeFileSync(join(outDir, `${runLabel}-waterfall.csv`), `${csvHeader.join(',')}\n${csvRows.join('\n')}\n`);

  console.log(JSON.stringify({
    runLabel,
    exit: 0,
    browser: browserVersion?.Browser || browserVersion?.['Browser'] || null,
    heroFrameNetworkCompleteAtMs,
    heroFrameNetworkCompleteReason,
    totalRequests: finalSummary.totalRequests,
    failedRequests: finalSummary.failedRequests,
    heroFrames: finalSummary.heroFrames,
    keyGroups: Object.fromEntries(Object.entries(finalSummary.groups).filter(([key]) => /firstParty:(all|js|css|font|image|media)|thirdPartyPlayer:all|initialToHeroFrameNetworkComplete:firstParty:(all|js|css|font|image|media)/.test(key))),
    consoleEventCount: consoleEvents.length,
    runtimeExceptionCount: runtimeExceptions.length,
    logEntryCount: logEntries.length,
    artifacts: result.artifacts,
  }, null, 2));
} finally {
  try { pageClient?.close(); } catch {}
  try {
    const version = await fetch(`http://127.0.0.1:${cdpPort}/json/version`).then((res) => res.json()).catch(() => null);
    if (version?.webSocketDebuggerUrl) {
      client = new CDPClient(version.webSocketDebuggerUrl);
      await client.open();
      await client.send('Browser.close').catch(() => {});
      client.close();
    }
  } catch {}
  await sleep(1000);
  if (!browserProcess.killed) browserProcess.kill('SIGTERM');
  await sleep(1000);
  if (!browserProcess.killed) browserProcess.kill('SIGKILL');
  try {
    rmSync(profileDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`profile cleanup warning: ${profileDir}: ${error.message}`);
  }
}
