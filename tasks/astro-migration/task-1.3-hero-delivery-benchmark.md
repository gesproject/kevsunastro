# Task 1.3 — Hero delivery benchmark

**Captured:** 2026-08-01
**Scope:** measurement only. No production app code (`app/`, `components/`, `lib/`), dependency, lockfile, Vercel, Supabase, Cloudflare, DNS, or credential was changed. All generated media lives under `references/task-1.3/assets/` and is git-ignored; only the scripts and raw result files are committed.

## What was measured, and how to reproduce it

The asset set is the shipped `public/frames-mobile/` sequence: **193 JPEGs, 19,568,732 B (18.66 MiB) on disk, 1176×1764 each**. (The task brief said 197 files / ~37 MB; the directory on this branch contains 193 files / 18.66 MiB, which matches the 193-frame count in `components/sections/Hero.tsx` and the Task 0.3 baseline.)

1. Encode the candidates and measure objective quality against the shipped JPEGs:

   ```bash
   bash tasks/astro-migration/references/task-1.3/encode.sh
   ```

   ffmpeg 8.1-essentials (libwebp, libaom-av1, libx264, libvpx-vp9) was already installed; no toolchain was added. SSIM is computed with ffmpeg's `ssim` filter against the shipped JPEGs, so `1.000000` for the baseline means "identical to what ships today", not "mathematically lossless".

2. Run the browser benchmark:

   ```powershell
   node tasks/astro-migration/references/task-1.3/bench.mjs
   ```

   `bench.mjs` serves the repo from a local `node:http` server with `Accept-Ranges: bytes`, `Cache-Control: public, max-age=31536000, immutable`, and COOP/COEP, then drives headless **Edge 150.0.4078.105** over CDP at a 375×812 mobile viewport, DPR 1. Every candidate is run three ways: cold on the Chrome DevTools **Slow 4G** profile (209,715 B/s down, 150 ms RTT), cold on unthrottled loopback (comparable to the Task 0.3 waterfall), and warm-cache. Two additional runs point the harness at a missing asset to exercise the fallback path.

   `harness.html` is the page under test. It implements the same scroll gate as production intent (wheel/touch locked until the hero can render) so that a fallback that fails to unlock would be visible as a trapped scroll.

The full matrix was run twice. Run 2 is authoritative and is what the tables below quote; run 1 is retained because its video byte totals under-report streamed range requests (`Network.loadingFinished` never fires for a request still in flight — `bench.mjs` now also accumulates `Network.dataReceived`).

### Evidence files

- `references/task-1.3/encode.sh` — encoder and SSIM pipeline.
- `references/task-1.3/harness.html` — instrumented page (both strategies, gate, fallback).
- `references/task-1.3/bench.mjs` — static server + CDP runner.
- `references/task-1.3/results/encode-sizes.csv` — bytes and SSIM per variant.
- `references/task-1.3/results/encode-log.txt` — encoder run log.
- `references/task-1.3/results/bench-results.json` — run 2, all 23 runs, raw.
- `references/task-1.3/results/bench-results-run1.json` — run 1, raw (see caveat above).
- `references/task-1.3/results/bench-log.txt` — run 2 console log.

## Comparison table

Byte totals are file sizes on disk (authoritative). Timings, transfer figures, and working set are from the cold **Slow 4G** runs, quoted `run 1 / run 2`; a single value means the two runs agreed closely.

| Variant | Total bytes | vs 8 MiB budget | Requests | SSIM vs shipped JPEG | Time to first interaction | Bytes before first interaction | Scrub cost per frame (fully loaded) | Browser working set |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **A0** JPEG sequence (ships today) | 19,568,732 (18.66 MiB) | **233%** ✗ | 193 | 1.000000 | 1180 / 1284 ms | 156,626 B | 0.005 ms draw | 986.5–990.6 MB |
| **A1** WebP q80 sequence | 6,697,540 (6.39 MiB) | 80% ✓ | 193 | 0.992541 | 743 / 728 ms | 32,666 B | 0.005–0.010 ms draw | 985.4–986.8 MB |
| **A2** AVIF crf32 sequence | 2,894,543 (2.76 MiB) | 34% ✓ | 193 | 0.989649 † | 551 / 593 ms | 14,512 B | 0.005 ms draw | 979.9–981.2 MB |
| **B1** H.264 CRF23 GOP30 | 2,692,686 (2.57 MiB) | 32% ✓ | 1 | 0.992289 | 1550 ms / **gate timeout** | 48,208 B ‡ | 67 ms / not measured | 508.7–519.6 MB |
| **B2** H.264 CRF23 GOP10 | 3,183,303 (3.04 MiB) | 38% ✓ | 1 | 0.992317 | 1310 / 2019 ms | 48,208 B ‡ | 41 / 97 ms seek | 534.2–536.3 MB |
| **B3** H.264 CRF23 all-intra | 8,848,171 (8.44 MiB) | **106%** ✗ | 1 | 0.993028 | 2257 / 2424 ms | 48,208 B ‡ | 28 / 58 ms seek | 532.4–533.3 MB |
| **B4** VP9 CRF32 GOP10 | 2,180,474 (2.08 MiB) | 26% ✓ | 1 | 0.980681 | 1186 / 3337 ms | 48,208 B ‡ | 33 / 139 ms seek | 513.5–516.5 MB |
| Poster / final-frame fallback | 47,908 (46.8 KiB) | — | 1 | — | 83–91 ms to unlock | 48,448 B | n/a | 422.4–447.4 MB |

B1's run-2 scrub is "not measured" because `loadeddata` never fired inside the 4 s gate in that run, so the harness took the fallback path and skipped the seek sweeps.

† AVIF SSIM is the mean of 17 evenly spaced frames, not the full sequence: ffmpeg's `image2` demuxer cannot bind an `.avif` sequence to a filtergraph, so per-frame comparison was used instead. Per-frame values ranged 0.987711–0.991737.

‡ The 48,208 B measured before first interaction for every video variant is the poster image. The video's own bytes at `loadeddata` are **not directly measured** — a media element's range requests do not surface as Resource Timing entries. The buffered range at that moment was 0.24–0.64 s of a 6.433 s clip (3.7–9.9%), which **computes** to roughly 100–320 KB depending on variant. Reported as computed, not measured.

### Decode and seek behaviour

| Variant | Per-frame decode, arrivals spread out (Slow 4G) | Decode-queue latency when all frames land at once (loopback) | Random-access scrub, fully loaded | Scrub before full download (Slow 4G) |
|---|---:|---:|---:|---:|
| JPEG sequence | 10.9 / 12.1 ms | 268 / 325 ms | 0.005 ms | 25 of 193 frames available at 13.2 s |
| WebP sequence | 16.4 / 17.9 ms | 418 / 509 ms | 0.005–0.010 ms | 25 of 193 frames available at 5.2 s |
| AVIF sequence | 16.9 / 78.3 ms | 370 / 1328 ms | 0.005 ms | 25 of 193 frames available at 2.8 s |
| H.264 GOP30 | n/a | n/a | 68 ms / not measured | 689 ms per seek (run 1 only) |
| H.264 GOP10 | n/a | n/a | 43 / 98 ms | 808 / 1715 ms per seek |
| H.264 all-intra | n/a | n/a | 33 / 73 ms | 2074 / 2520 ms per seek |
| VP9 GOP10 | n/a | n/a | 44 / 174 ms | 634 / 2751 ms per seek |

Two things the decode columns show. First, the honest per-frame decode cost is the Slow-4G column, where frames arrive spaced out and each `decode()` is measured in isolation. Second, on a fast link every frame lands at once and decodes serialise: the last frame's `decode()` promise resolves 268–1328 ms after its bytes arrived. That is the mechanism behind the Task 0.3 finding that the current hero waits on all 193 decodes before it initialises the timeline.

Video seek latency is measured as the full `currentTime = t` → `seeked` round trip, i.e. frame-accurate random access. A production scrub that sets `currentTime` without awaiting `seeked` would feel smoother than these numbers, but frame accuracy is bounded by them.

### Cache behaviour

Warm-cache runs served **0 media bytes** for every candidate: 194/194 requests from cache for the sequences, 2/2 for the video variants, with `Cache-Control: immutable`. The difference is granularity, not hit rate — a sequence occupies 193 independently evictable cache entries, so a partially evicted sequence re-downloads a subset, while the video is one entry that is either present or refetched whole (by range).

### Low-memory mobile behaviour

Total OS working set across the isolated browser's processes, sampled at the end of each run via `SystemInfo.getProcessInfo` + `Get-Process`:

| Condition | Working set | Delta vs no-media baseline |
|---|---:|---:|
| No media loaded (fallback run) | 422.4–447.4 MB | — |
| Any image sequence, cold (JPEG, WebP, or AVIF) | 968.6–998.5 MB | **+521 to +576 MB** |
| Any video variant, cold | 495.5–536.3 MB | +48 to +114 MB |
| Image sequence, second load in the same browser | 1518.9–1623.9 MB | — |
| Video, second load in the same browser | 563.0–622.9 MB | — |

The sequence cost is essentially identical for all three source formats, which is the point: it is driven by 193 retained decoded bitmaps, not by encoded bytes. 193 × 1176 × 1764 × 4 B **computes** to 1.60 GB of raw RGBA; the browser evidently keeps a discardable subset, but the measured residency is still ~5× the video's over baseline. `performance.measureUserAgentSpecificMemory()` was enabled via COOP/COEP and reported 590,994–680,811 B across every run, confirming that decoded-image residency lives outside the JS heap and that `JSHeapUsedSize` (602,552–682,540 B) is not a usable proxy for it.

The sequence figure reflects retaining every decoded frame for the lifetime of the page, which is what `Hero.tsx` does today (193 `HTMLImageElement`s held in `imagesRef`). A sequence implementation that capped retained frames would trade this memory back for re-decode cost, measured above at 10.9–17.9 ms per frame.

### Visual quality notes

All candidates except VP9 land within 0.0034 SSIM of each other (0.9896–0.9930) against the shipped JPEGs, so at these settings the choice is not a quality choice. VP9 at CRF 32 is the outlier at 0.980681 and was not tuned further. Quality points were selected from a sweep on frame 96 (WebP q72/80/86 → 0.9911/0.9928/0.9943; AVIF crf28/32/36 → 0.9915/0.9903/0.9888). No side-by-side human visual review was performed; SSIM is an objective proxy, and a human check of the selected format against the Task 0.2 contract should happen before the hero is rebuilt.

## Recommendation

**Ship the hero as a single H.264 MP4, CRF 23, GOP 10, `yuv420p`, `+faststart`, muted and `playsinline`, with the final frame as the poster (variant B2).**

Reasoning, in the order the measurements support it:

1. **It is the only option that fixes the budget failure without a new risk.** The shipped JPEG sequence is 233% of the 8 MiB full-sequence budget. B2 is 3,183,303 B — 38% of budget, a 6.1× reduction — at an SSIM of 0.992317 against what ships today.
2. **Memory is the decisive measured difference.** Every image-sequence variant costs +530 to +560 MB of browser working set regardless of codec, because the cost is 193 retained decoded bitmaps. The video costs +55 to +100 MB. On the low-memory mobile devices this hero has to survive, that gap is the difference between a backgrounded tab that survives and one that is reclaimed.
3. **193 requests become 1**, served over byte ranges rather than 193 independently cached, independently evictable entries. B2 itself transferred in full in both runs; partial transfer was only observed for B1 under Slow 4G (863,448 B of 2,692,686 B), in the same run whose gate timed out, so no adaptive-savings claim is made for the recommended variant.
4. **GOP 10 over GOP 30 or all-intra.** All-intra seeks fastest (28–58 ms) but is 8.44 MiB, over budget. GOP 30 is 490 KB smaller than GOP 10 but seeks 1.6–3.5× slower and produced the one gate timeout observed in the whole matrix. GOP 10 is the balance point: 3.04 MiB, 41–97 ms seeks, no gate failures across either run.
5. **VP9 was rejected** despite being the smallest (2.08 MiB): lowest SSIM (0.9807), no Safari-wide guarantee for this use, and seek latency as unstable as GOP 30's.

### The measured cost of this recommendation

Video scrub is **three to four orders of magnitude slower per frame access** than drawing a pre-decoded bitmap: 41–97 ms per frame-accurate seek versus 0.005 ms per `drawImage`. Time to first interaction is also less predictable for video (1310–2019 ms for B2 across runs, and 1186–3337 ms for VP9) than for a sequence (728–743 ms for WebP, 551–593 ms for AVIF, both runs). If the real-device check below fails, **AVIF crf32 (variant A2) is the documented alternative**: it also meets both budgets (2.76 MiB, 34%), has the fastest and most stable first interaction of anything measured, and instant scrub — at the cost of the +530 MB memory profile and 193 requests.

### Budget exception requested

**None.** Variant B2 meets the initial hero media budget (≤750 KiB: 48,208 B measured poster plus a computed 100–320 KB of buffered video) and the full mobile hero sequence budget (≤8 MiB: 3.04 MiB). The exception would only be needed if the human chose to keep the current JPEG sequence (233% of budget) or the all-intra encode (106%).

### Decision the human needs to make

The recommendation is sound on every number this environment can produce, but two properties of the video path could not be measured here and both are iOS-specific:

- inline scroll-scrubbing of a muted `playsinline` video on real iOS Safari, and
- real renderer memory limits on a low-end Android or older iPhone.

Ask for a real-device pass on B2 before Task 1.4 locks the hero format. If iOS inline scrub stalls, switch to A2 (AVIF sequence) — no re-benchmark needed, the numbers are in this document.

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| Options are compared with bytes, requests, decode behavior, and visual notes. | **Met** | Seven variants across both strategies, measured for bytes (`encode-sizes.csv`), request count, decode/seek behaviour, cache behaviour, working-set memory, and SSIM. Raw per-run data in `bench-results.json`. |
| The selected approach meets the initial-media and full-sequence budgets or has an approved exception. | **Met, no exception needed** | B2 initial media: 48,208 B measured (poster) + 100–320 KB computed buffer, against ≤750 KiB. Full sequence: 3,183,303 B against ≤8 MiB. |
| First interaction works before the complete sequence downloads. | **Met** | On Slow 4G, B2 unlocked the scroll gate at 1310 ms (run 1) and 2019 ms (run 2) with only 0.267 s of a 6.433 s clip buffered — 4.1% of the media. `locked: false`, `scrollMoved: true` in both runs. The image-sequence variants unlock even earlier (551–1284 ms) on frame 1 alone, and reach a 25-frame full-range coarse scrub at 2.8 s (AVIF) / 5.2 s (WebP) while the rest still downloads. |
| Failure falls back to a poster/final frame without trapping scroll. | **Met** | Both fallback runs (`seq-jpeg+fail`, `video-h264-gop10+fail`) resolved to `unlockReason: "fallback:error"` at 83–91 ms, with `locked: false`, `scrollMoved: true`, and the 47,908 B final-frame poster rendered. Verified in both run 1 and run 2. |

## Limitations carried forward

- **No real mobile device.** Everything was measured in headless Edge 150 on Windows at a 375×812 emulated viewport. Working-set figures are desktop browser residency, not an iOS or Android renderer limit, and no iOS Safari behaviour — inline scrub, seek throttling, memory reclamation — was measured at all.
- **Reduced motion was not exercised as a separate run.** The intended reduced-motion path is a static final frame with no scrub, which is byte-for-byte the fallback path that was measured (47,908 B poster, gate open in 83–91 ms, scroll free). That is a proxy, not a test of a reduced-motion implementation, because no such implementation exists yet.
- **HTTP/1.1 local origin, not Cloudflare.** The 193-request sequence is not penalised as hard here as it would be on a high-latency H1 origin, and not helped as much as it would be by H2/H3 multiplexing on Cloudflare. At the 209 KB/s Slow 4G rate the sequences were bandwidth-bound, not connection-bound.
- **Bytes before first interaction for video are computed, not measured** (see ‡ above).
- **Two runs, not three, and no medians of medians.** Run 2 was systematically slower than run 1 for the video and AVIF variants (for example B2 sequential seek 41 → 97 ms); both are reported rather than the more flattering one. The one qualitative divergence between runs is recorded: B1 (GOP 30) fired `loadeddata` within the 4 s gate in run 1 but not in run 2, where the gate opened by timeout with the poster still displayed.
- **No Lighthouse re-run.** These variants were not scored against the Task 0.3 Lighthouse baseline; that belongs to the rebuilt hero, not to a harness page.
- **No human visual review** of the re-encodes against the Task 0.2 parity contract. SSIM only.
