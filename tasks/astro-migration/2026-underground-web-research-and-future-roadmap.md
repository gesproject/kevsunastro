# Sölbo — 2026+ Underground Web Research & Future Experience Roadmap

**Research date:** 23 July 2026  
**Project audited:** `Kev.Sun-astro-7-cloudflare`  
**Research scope:** live underground electronic-artist, label, radio, club, and festival websites; official Astro/Cloudflare/browser documentation; the current Sölbo repository, code, media, and captured reference frames.

> This is a design/architecture research document, not a redesign mandate. The migration remains parity-first. New experience work should begin only after the current visual contract and risky Astro/Cloudflare/Keystatic/media choices are approved.

## 1. Executive direction

The best future Sölbo site is not a larger Linktree, a generic portfolio, or a miniature streaming service. It should be a **cinematic first-party signal hub** that makes four actions unmistakable:

1. **Hear the current release or set.**
2. **Support/buy/save it on the right platform.**
3. **Find the next show and get a ticket.**
4. **Book Sölbo with credible material in under 90 seconds.**

The memorable layer should feel like **a living night archive**: silver daylight collapsing into black club space; releases and performances recorded as artifacts; restrained signal/wave behavior that responds to intentional listening rather than running as decorative noise forever.

### The recommended experience model

- **Scene 1 — Signal:** preserve the portrait sequence and oversized Sölbo lockup, but add one timely, factual signal: latest release or next show.
- **Scene 2 — Transmission:** one featured release/set gets room to breathe and a clear `Listen / Buy / Save` hierarchy. The visual field may react only after the visitor presses play.
- **Scene 3 — Evidence:** upcoming shows, selected archive, and an accessible booking/EPK route prove momentum.
- **End credits:** retain the oversized watermark and wave language; let the motion decay into stillness instead of adding another competing spectacle.

The rule: **one unforgettable cinematic world, a small family of interactions made from the same visual material, and zero mystery around the important actions.**

### Art-direction correction — 25 July 2026

The earlier benchmark pass over-weighted minimalist archives and functional label/festival sites. Those examples remain useful for content structure, direct-to-fan conversion, and operational durability, but **they are not the visual north star**.

The preferred Sölbo direction is now explicit:

- a consistent one-page cinematic journey rather than a stack of minimalist archive pages;
- the artist/portrait remains the visual and emotional center;
- atmospheric backgrounds behave like light, heat, grain, fog, or film exposure—not generic gradients;
- typography is oversized and graphic enough to become scenery;
- cursor and scroll interactions leave a trace or memory in the visual field;
- grey must feel alive and dimensional before the site descends into black;
- section transitions should feel like edits in one film, not separate components entering independently;
- conversion UI remains visible, but should be integrated into the cinematic composition rather than defining it.

The two direct reference anchors are now:

1. [Lucky Done Gone](https://luckydonegone.com/) for the continuous atmospheric background, grain, expressive typography, blur language, and tactile page feel.
2. [HÖR Maximum Heat 2026](https://hoer.live/maximum-heat-contest-2026/) for pointer-created heat memory behind transparent content.

The objective is not to copy their warm cream/red palette or rainbow heat scale. It is to reinterpret both as a **cold grey Sölbo exposure field** built around the portrait.

---

## 2. Important current-state correction

The migration worktree exists, but the root application is **not yet an Astro application**. It is still the Next.js 16 / React 19 / Tailwind / Supabase-shaped source on branch `migration/astro-7-cloudflare`; `package.json` still runs `next dev` and `next build`. The project task system says Phase 0 is in progress and the Astro foundation is still Phase 2.

This is good timing for research: architecture and experience decisions can be added before the root conversion, without rewriting an Astro implementation that already shipped.

Also update the host wording during Gate A: current official Astro guidance says **Cloudflare recommends Workers for new projects**; Pages remains relevant for existing deployments. The target should be evaluated as **Astro 7 on Cloudflare Workers with static assets**, not assumed to be a new Pages project.

Official sources:

- Astro Cloudflare deployment: https://docs.astro.build/en/guides/deploy/cloudflare/
- Astro Cloudflare adapter: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Cloudflare Workers static assets: https://developers.cloudflare.com/workers/static-assets/

### Verified 2026 toolchain snapshot

At research time, the public registries reported:

- `astro` **7.1.3**;
- `@astrojs/cloudflare` **14.1.4**;
- `wrangler` **4.114.0**.

Treat these as a dated snapshot, not floating install instructions. Pin exact versions only after the Astro/Keystatic/Cloudflare spike passes. Astro 7 moves to Vite 8, stabilizes route caching, makes queued rendering the default, and removes `@astrojs/db`; integrations can lag a major Vite transition.

---

## 3. What the current Sölbo work already does well

### Strong art direction

- The desktop hero has a confident editorial composition: large negative space, right-weighted portrait, huge black wordmark, and a grey field that feels more fashion/editorial than generic “dark DJ website.”
- The grey-to-black handoff is a real narrative cut, not a collection of disconnected sections.
- The mobile first scene is polished and clear, with large social icons and a prominent `See website` action.
- The show table plus monochrome performance image reads as credible underground event design.
- The footer watermark and wave field have the potential to feel like end credits rather than a normal footer.
- The current ordering—Hero → Music → Shows → Footer—is already the right basic story.

### Strong engineering intentions in the migration plan

- zero public React by default;
- static public rendering;
- Git-backed editing;
- progressive enhancement and no-JS content;
- explicit media/JS/Core Web Vitals budgets;
- reduced-motion, keyboard, focus, and failure-state acceptance;
- reversible Vercel/Supabase retirement rather than destructive early cutover.

These should remain non-negotiable.

---

## 4. Current gaps that research says to solve first

### 4.1 The hero is holding the site hostage

The repository contains **193 JPEG frames totaling 18.66 MiB**. Current code requests every frame immediately and marks the hero ready only when every load/decode callback settles.

- Full-sequence target in the migration plan: **8 MiB**.
- Current sequence: **2.33× over** that target.
- Initial hero target: **750 KiB**.
- Current all-at-once frame request: **25.5× the initial target** before counting CSS, JS, fonts, or other images.
- Required reduction to meet the 8 MiB full-sequence target: **57.1%**.

The captured full-page/music evidence also demonstrates the artistic cost: a visitor or capture can see a large empty grey/loading field instead of the intended page. A cinematic site cannot make its best content wait behind its heaviest effect.

### 4.2 The release section does not yet convert

- Release tiles are visual `div`s, not links.
- Spotify/SoundCloud values remain placeholders; the UI falls back to mock players that visually resemble controls without being real players.
- The three-column mobile catalog makes art and titles small.
- There is no explicit hierarchy between **buy/support**, **DJ download**, **listen**, and **save**.
- Iframes are lazy but still platform-owned third-party surfaces; a click-to-load gate would improve privacy and transfer cost.

### 4.3 Show information is visually strong but operationally thin

- Current mock shows are 2025 dates in a 2026 project.
- Ticket controls have very small visual/tap geometry.
- Status is limited to ticket/free/sold-out; there is no announced/on-sale/low/cancelled/postponed model.
- No timezone, doors/set time, calendar action, map, RA link, or past-show archive exists.
- The idle opacity sweep and hover text scrambling lack a reduced-motion branch and are not keyboard-equivalent.

### 4.4 Motion accessibility is incomplete

- Lenis correctly exits for `prefers-reduced-motion`.
- The hero has a reduced-motion entry path.
- Film grain still runs indefinitely.
- Footer waves run continuously without a reduced-motion branch.
- The mesh gradient has no observed offscreen/visibility pause.
- Shows run perpetual idle animation after inactivity.
- There is no custom global `:focus-visible` treatment.

Reduced motion should be a separately art-directed cut, not simply “some animations happened not to start.”

### 4.5 Breakpoint logic is inconsistent at exactly 768 px

The Hero uses mobile through 767 px and desktop from 768 px. Music, Shows, and Footer use mobile through 768 px and desktop from 769 px. At 768 px the page mixes desktop Hero behavior with mobile section timelines. Create one shared breakpoint token/constant and make CSS and JS agree.

### 4.6 The public information layer is too thin

Current metadata is only `Sölbo` + `Electronic music artist`. The public page has no observed canonical URL, rich social card, artist/release/event JSON-LD, press/booking route, privacy page, or durable release/show URLs. Placeholder social/music links remain.

### 4.7 Runtime/dependency opportunities

- `@paper-design/shaders-react` requires a React island for a background effect.
- `three` and `@react-three/fiber` are installed but no direct production use was found in the inspected source.
- Astro migration should remove unused Three/R3F and replace the shader with direct Canvas/WebGL/CSS only if it materially earns its bytes.
- Third-party frames should load after intent and never block primary content.

---

## 5. Live underground-web benchmark set

### Research method and caveat

The sites below were opened in a current Chromium session on 23 July 2026 and inspected through rendered text, navigation, media/DOM signals, and screenshots. “2026 benchmark” means **live and observed in 2026**; it does not claim every site launched or redesigned in 2026. Current content dates are noted where visible.

### 5.1 Artists and artist archives

| Site | Live observation | Pattern worth adapting | Do not copy |
|---|---|---|---|
| [Max Cooper](https://maxcooper.net/) | Deep archive of audiovisual works, essays, events, journal, store, contact, community links. Current footer/content references 2026. | Treat each major release/live work as a permanent “world” with visual + written context, not a disposable card. | The density would overwhelm Sölbo if every project entered the homepage. Curate 3–5. |
| [Floating Points](https://floatingpoints.co.uk/) | Campaign-led page with `Explore`, `Listen now`, physical `Buy`, tour dates, repeated `Get tickets`, and mailing list. Current tour dates are 2026. | A current campaign can visually dominate while utility stays explicit. Put listen/buy/tickets in the same visual language. | Repeated ticket rows and store blocks can feel transactional; Sölbo needs more atmosphere and less repetition. |
| [Nicolas Jaar / Jaar archive](https://www.jaar.site/) | Extremely text-first artist archive with projects, political/contextual writing, Bandcamp, event links, mailing list, and an Astro tech hint. | Underground credibility can come from authorship and archive depth, not effects. Add concise notes/credits/context to releases and sets. | Raw link density and tiny typography are not appropriate as the primary mobile interface. |
| [Caterina Barbieri](https://caterinabarbieri.com/) | Highly repetitive track-title/typographic system around a focused body of work. | Use a track list as graphic material for one campaign scene. | Repeated DOM text can become noisy for assistive tech and search; decorative repetitions must be `aria-hidden`. |
| [Ryoji Ikeda](https://www.ryojiikeda.com/) | Long-lived factual archive of works, performances, exhibitions, recordings, biography, contact, and shop. | Build durable canonical history instead of remaking the whole site per release. | Legacy density and minimal hierarchy require care on mobile. |
| [Arca](https://arca1000000.com/) | Commerce/player-first release store with format selection, catalog, play controls, support/legal links. | Give owned products and current release a direct purchase path. | Do not reduce the artist site to a white-label store or require account/cart flow for normal listening. |

### 5.2 Labels, clubs, radio, and scene infrastructure

| Site | Live observation | Pattern worth adapting | Do not copy |
|---|---|---|---|
| [Ilian Tape](https://iliantape.de/) | Dense feed of releases, podcasts, video, artist links, Bandcamp/shop/distributor CTAs; current posts include 2026. | Present releases/sets as dispatches with catalog codes, credits, stores, and direct listening. | Tiny neon-on-black link columns and excessive density reduce scan speed. |
| [PAN](https://home.p-a-n.org/) | Extremely restrained campaign surface with only Releases, Shop, Info, Subscribe and a single media frame. | Restraint: one visual, four routes, no generic sections. | A loader/media failure can leave almost nothing; Sölbo must always show content and CTAs. |
| [Hessle Audio](http://hessleaudio.com/) | Minimal navigation—Home, Discography, Bandcamp, Contact—with WebGL/canvas/media hints. | A complete label identity can survive with a tiny navigation set. | Its HTTPS certificate currently has a hostname mismatch; infrastructure reliability is part of design. |
| [Incienso](https://incienso.nyc/) | Image-heavy roster/release catalog with mixes, merch, shop, artist and format labels; many sticky elements. | Archive by artist/release format, with visible covers and a tactile catalog feeling. | Dozens of sticky elements and large media surfaces can become expensive and disorienting. |
| [Tresor Berlin](https://tresorberlin.com/) | Clear split between Club, Info, Label, Shop, plus newsletter; sparse home presentation. | Separate visitor intents cleanly instead of blending club/label/store. For Sölbo: Listen, Shows, Book. | Sparse content without a strong current signal can feel abandoned. |
| [raster](https://raster-media.net/) | Artistic platform framing with projects, artists, shop, booking, licensing, newsletter and 2026 items. | Booking and licensing belong in the primary professional architecture, not buried in the footer. | Commerce, consent, and navigation layers can visually compete with the art. |
| [NTS](https://www.nts.live/) | Persistent live/player controls, tracklists, collections, saved shows, infinite mixes, shop, community and dense discovery. | After intentional play, a compact persistent player can connect the whole Sölbo experience. Tracklists and saved set context create return value. | NTS-level product complexity is inappropriate for one artist; do not build accounts, recommendations, or a giant media app. |
| [HÖR](https://hoer.live/) | Live/archived sets, artist/style filters, track IDs, comments, favorites, calendar, membership; current library entries dated July 2026. | A Sölbo set archive with tracklist/cue chapters and event context can become a real fan utility. | The audit found over 2,000 links and 300 images; do not import platform-scale density or consent burden. |

### 5.3 Festivals and experimental programs

| Site | Live observation | Pattern worth adapting | Do not copy |
|---|---|---|---|
| [Unsound](https://www.unsound.pl/en/) | Strong monochrome grid, artist index, news, archives, bilingual navigation, 2026 program and long historical archive. | Combine current signal + permanent archive; let strict grids create underground authority. | Many controls/year filters are only justified by a large festival archive. |
| [Rewire](https://www.rewirefestival.nl/) | Calendar, line-up, tickets, features/interviews, archive, education, press and year-round events; current 2026/2027 content. | Events can coexist with editorial context. Add short post-show/release stories, not a generic “blog.” | Timetable-level IA and cookie overlays would be overbuilt for Sölbo. |
| [CTM](https://ctm-festival.de/) | 2027 concept presented as a typographic editorial thesis—huge serif type, broken word, concise manifesto, direct `read more`. | Give each major release era one conceptual sentence and one typographic behavior. Meaning precedes motion. | Cookie UI currently occupies a large first-screen region; keep consent surfaces proportionate. |
| [MUTEK](https://mutek.org/en) | Full-bleed campaign artwork, clear edition/city navigation, concrete `Explore` CTA, bottom utility rail. | A single strong commissioned visual can carry a season; use an anchored utility rail for critical routes. | Generic glossy 3D without a Sölbo-specific concept would feel trend-led rather than authored. |
| [Dekmantel](https://dekmantel.com/) | Editorial mix series, bold modular artwork, records/shop/events, direct copy and consistent typographic grammar. | Build a recognizable cover/episode system for Sölbo sets and releases. | The homepage can resemble a publication/store more than an artist world; retain Sölbo’s emotional hero. |
| [Draaimolen](https://www.draaimolen.nu/) | Minimal teaser language—“What makes us wander?”—and a current favorite full-circle set prompt. | One poetic question plus one playable artifact can create intrigue without feature overload. | Do not let a teaser remove normal links or crawlable event information. |
| [Sónar](https://sonar.es/en) | Multi-track festival ecosystem, galleries, mixes, technology program, practical info and a large newsletter conversion area; current 2026/2027 content. | Treat owned audience capture as a real scene, not a tiny footer form. | Sponsor/nav/cookie layers create institutional clutter; Sölbo should stay intimate. |
| [L.E.V. Festival](https://levfestival.com/) | Experimental visual program with canvas use, past editions, press, contact and newsletter. | Canvas can serve a focused campaign identity when paired with factual archive routes. | A canvas-first front door cannot be the only way to understand or navigate the site. |

### 5.4 Selective studio/award benchmarks

These are not underground-artist references and should not define the visual language. They are useful as narrow technical evidence.

| Experience | Direct observation | Transferable lesson | Guardrail |
|---|---|---|---|
| [Spectral Field / Rob FWA](https://www.robfwa.com/) ([Awwwards listing](https://www.awwwards.com/sites/spectral-field)) | A client-side canvas experience exposes FFT bands, 37 shuffled tracks, “use your own track,” transport controls, and PNG/SVG export. | Sound-reactivity becomes memorable when it produces a shareable artifact, not generic equalizer bars. A Sölbo preview could generate one still poster/SVG after intentional playback. | Keep upload/audio processing local, explain permissions, never require microphone access, and provide a static result/fallback. |
| [Spotify Wrapped Party / Active Theory](https://www.awwwards.com/sites/spotify-wrapped-party) | Awwwards lists it as Site of the Day on 24 July 2026 with GSAP, WebGL, sound/audio, data visualization, and Active Theory credit. The live demo redirected the automated browser to an unsupported/loading state, so interaction details were not treated as directly observed. | Music data can drive an environmental scene. | Do not copy the account/Firebase/product scope or ship an unsupported-browser dead end. |

### 5.5 The most important negative benchmark: domain decay

Several artist/label domains in the candidate set were parked, expired, DNS-failing, certificate-broken, or unreachable: Objekt, Sherelle, AD 93, Eartheater, Jlin, aya, and others. This is a stronger future-proofing lesson than any shader:

- keep domain and Cloudflare account client-owned;
- enable registrar auto-renew and recovery contacts;
- keep DNS/documentation outside one developer’s personal account;
- preserve redirects when campaign domains change;
- maintain a static emergency fallback;
- monitor uptime, TLS, and broken outbound links;
- avoid a site that depends on one abandoned proprietary platform.

A beautiful dead artist site is not a brand asset.

### 5.6 Cinematic benchmark expansion — closer to the Sölbo ambition

This second research pass deliberately excluded generic minimalist archives and focused on ambitious, image-led, one-page or campaign experiences. The five closest references are ranked first.

| Rank | Experience | What was directly observed | Specific Sölbo translation | Main caveat |
|---:|---|---|---|---|
| 1 | [Serhat Durmus](https://serhatdurmus.com/) | Black/grey/red electronic-artist world with massive cropped type, gritty portrait/performance collage, scan/target marks, GSAP/Lenis/canvas/video signals. | Strong model for the grey Hero’s descent into black: retain the portrait, introduce harder cropped type and performance fragments after the frame sequence. | The live page is media-heavy; do not import seven iframes or let collage obscure Listen/Shows/Book. |
| 2 | [Lucky Done Gone](https://luckydonegone.com/) | Warm drifting shader field, large red type, blur reveals, print-like grain, frosted cards, rounded portrait treatment, desktop custom cursor. | Translate the material stack—not the colors—into cold silver/graphite cloud motion, oversized Sölbo type, subtle blur and grain. | WordPress page carried many scripts; reproduce the feeling with one small shader module and CSS, not the dependency stack. |
| 3 | [HÖR Maximum Heat 2026](https://hoer.live/maximum-heat-contest-2026/) | Dark grey/olive contest surface with pointer-generated heatmap blobs behind transparent content and oversized graphic identity. | Let cursor movement expose faint silver/graphite “thermal memories” behind release/show rows. Accent only real CTAs with a controlled cold-lime or pale-amber core. | The original rainbow heatmap and contest branding are distinctive; use a different palette, timing, geometry and density. |
| 4 | [Anyma](https://www.anyma.com/) | Full-screen environmental scene with a centered human figure facing monumental digital architecture; minimal UI floats above the world. | Treat the Sölbo portrait as a mythic spatial anchor rather than a profile image. Keep navigation thin and environmental scale large. | Heavy cinematic media must remain poster-first and cannot become the LCP blocker. |
| 5 | [Spectral Field / Rob FWA](https://www.robfwa.com/) | One contained client-side audio artwork: central red generative form, tap-to-play, local-track option, minimal controls. | A later release/set scene can transform the existing wave language into one authored audio artifact. | User gesture, rights, static fallback, reduced motion and GPU budget are mandatory. |
| 6 | [FKA twigs — EUSEXUA](https://eusexua.fkatwi.gs/) | Full-bleed audiovisual campaign with thin scene UI, vertical progression, unmute, subscribe and contact controls. | Add four restrained chapter markers—Signal, Music, Shows, Contact—without turning the page into a slideshow. | Tiny white UI over moving media needs stronger contrast and keyboard focus. |
| 7 | [Silent Partners Studio](https://silentpartnersstudio.com/) | One iridescent/macro moving material persists behind large white typography and sparse navigation. | Carry one grey “film material” through multiple sections so the experience remains one world. | Busy media beneath type can destroy readability; use masks and calmer zones. |
| 8 | [Rosalía](https://www.rosalia.com/) | Portrait-centered fashion/editorial campaign with wide-spaced typography and very little interface noise. | Evidence that the artist can remain the clear centerpiece while commerce/music CTAs stay present. | Translate away from glossy pop brightness into Sölbo’s colder underground treatment. |
| 9 | [ODESZA](https://odesza.com/) | Deep blue smoke/ink atmosphere with a centered geometric mark and sparse navigation. | Reference for a low-cost atmospheric field that creates depth without dozens of objects. | It is less narrative and less portrait-led; avoid passive splash-screen behavior. |
| 10 | [Coveo Music](https://coveomusic.com/) | Circular portrait core with orbiting rounded media tiles and spatial scroll choreography. | Releases or set memories could orbit the portrait briefly before resolving into readable content. | Do not create a permanently moving node cloud or a disorienting mobile layout. |
| 11 | [Indigo Laboratory](https://indigo-laboratory.it/) | Monochrome chapter language—RHYTHM, PULSE, WHISPER, RESONANCE, SUB-NOISE—with dense visual/media signals. | Give Sölbo’s major transitions one-word cinematic chapter cards rather than ordinary section labels. | The audited surface had a very large image count; Sölbo should achieve the grammar with type and a few assets. |
| 12 | [Manu Cossu](https://manucossu.com/) | Massive black abstract wave/chevron shape used as graphic architecture over a white field. | Use a single vector/wave mask to cut from grey portrait space into black music space. | Keep the result artist-led, not agency-portfolio styled. |
| 13 | [Justice — Hyperdrama](https://www.justice.church/) | Stark black album world with chrome/gothic identity, huge title, Listen, Store and tour conversion. | Reference for making the black lower act feel like a campaign, not an archive table. | More static than Sölbo’s target; borrow hierarchy, not the page structure. |
| 14 | [Die Antwoord](https://www.dieantwoord.com/) | Maximal performance-art collage of stickers, graffiti, neon and industrial texture. | A restrained flyer/sticker wall could appear inside the past-shows archive as a controlled eruption. | The live surface uses hundreds of images; never apply this density globally. |
| 15 | [Pacôme Pertant](https://pacomepertant.com/) | Tiny glowing green object on black anchors a motion-and-sound identity. | A small persistent signal glyph could connect scenes without competing with the portrait. | Supporting reference only; too sparse to define Sölbo. |

Two useful failure references were also observed: a fashion campaign that remained trapped on its loader in headless rendering, and an experimental producer site whose first paint was nearly blank. Both reinforce the requirement that Sölbo’s portrait, identity, core links and poster fallback must render before cinematic JavaScript succeeds.

---

## 6. What current underground sites consistently teach

### Patterns that feel genuinely underground

1. **Authored typography instead of generic UI decoration.** CTM, Unsound, Dekmantel, Jaar, and Ilian Tape use type as position and voice.
2. **Archives are identity.** Credibility comes from durable releases, mixes, flyers, writing, dates, and collaborators.
3. **The art and the utility coexist.** Floating Points, Rewire, NTS, and HÖR make listen/ticket/archive actions explicit.
4. **Underground does not mean all-black.** White editorial space, bruised grey, sharp color, and low-saturation photography can feel more distinctive than default black/neon.
5. **Campaigns change; navigation remains.** A new visual era should not erase shows, booking, catalog, or contact.
6. **Direct support matters.** Bandcamp, shop, vinyl, and download links frequently sit beside streaming—not below it.
7. **One conceptual move beats ten effects.** Broken type, one commissioned image, one signal field, or one archive grammar is enough.

### Anti-patterns to avoid

- first-screen cookie banners larger than the art;
- endless loaders and empty WebGL frames;
- autoplay audio;
- tiny all-caps text used for essential information;
- decorative text repetition exposed to screen readers;
- dozens of sticky surfaces;
- mock controls that look playable;
- platform-scale features on a single-artist site;
- every section animating independently;
- mystery-meat social icons without visible context;
- dead domains and campaign URLs with no redirect plan.

---

## 7. Recommended feature portfolio

Impact is for Sölbo’s brand/conversion. Effort is relative to this migration. Risk includes performance, accessibility, rights, privacy, and platform dependency.

| # | Feature | Impact | Effort | Risk | Recommendation |
|---:|---|:---:|:---:|:---:|---|
| 1 | **Next signal card** (latest release or next show) | H | S | L | Add to Hero without moving the approved portrait/wordmark composition. One timely fact, one CTA. |
| 2 | **Clickable release cards with CTA hierarchy** | H | S | L | `Buy/support` → `DJ download` → `Listen` → `Save`, based on available links. |
| 3 | **Release dossier routes** `/releases/[slug]` | H | M | L | Credits, artwork, note, tracklist, links, share image, canonical URL, MusicAlbum/MusicRecording JSON-LD. |
| 4 | **Show state machine** | H | M | L | Announced, on sale, low, sold out, free, postponed, cancelled, archived. |
| 5 | **Next-show utility** | H | S/M | L | Local and visitor time, venue/city, ticket/RA/map, doors/set time, `.ics`. |
| 6 | **Booking/EPK route** `/book` | H | M | L | Direct email, short bio, selected sets, availability, press shots, logo, rider, one-sheet/ZIP. |
| 7 | **First-party smart-link page** `/listen/[slug]` | H | M | M | Explicit platform chooser; preserve UTM; privacy-safe outbound events. No opaque instant redirect by default. |
| 8 | **Click-to-load platform embeds** | M/H | S | L | Show local artwork/title/CTA first; create iframe only after intent. |
| 9 | **Privacy-friendly outbound analytics** | H | S/M | L | Track buy/listen/ticket/book/calendar/embed actions, not identity dossiers. |
| 10 | **Reduced-motion parallel cut** | H | S/M | L | Poster-led hero, no pins/traps, static waves, restrained opacity cuts, full utility preserved. |
| 11 | **Low-data club mode** | M/H | S | L | Disable sequence/shaders/embeds; retain releases, tickets, booking. Persist user choice locally. |
| 12 | **Set archive** `/sets/[slug]` | H | M | M | SoundCloud/owned preview, tracklist/cue chapters, event context, flyer, date, style/energy tags. |
| 13 | **Persistent mini-player after user intent** | M/H | M | M | Never autoplay. Keep controls and current set available between Astro pages. |
| 14 | **Audio-reactive footer signal** | M | M | M | React only to a self-hosted, rights-cleared preview; third-party iframe audio is unsuitable for analysis. |
| 15 | **Post-show afterglow pages** | M | M | M | 24–72h recap with image/flyer, embedded set if available, thank-you, next-city CTA. |
| 16 | **Past-night flyer archive** | M | M | M | Accessible list first; optional constellation/wall view as enhancement. |
| 17 | **Email/RSS drop feed** | H | M | M | Ownable audience for releases, shows, and sets; explicit consent and unsubscribe. |
| 18 | **City/timezone-aware show rendering** | M | S/M | L | Store ISO timestamp + IANA timezone; render venue local and visitor local carefully. |
| 19 | **Press quote provenance** | M | S | L | Quotes link to source and date; no fake social proof. |
| 20 | **Private booker preview links** | M | M | M | Expiring unlisted pages for unreleased clips/EPK; no public indexing. |
| 21 | **Print/PDF booking one-sheet** | M/H | M | L | Generate from the same content model to prevent stale PDFs. |
| 22 | **Media Session controls** | M | M | M | For owned audio previews/sets only; lock-screen metadata and hardware controls. |
| 23 | **PWA offline crate** | M | M/L | M | Cache EPK, selected artwork/text, upcoming shows. Never promise offline third-party streams. |
| 24 | **Visual era tokens** | M | M | L | CMS-selected palette/type/accent per release era while keeping layout and accessibility stable. |
| 25 | **Signal easter eggs** | L/M | S | M | Hidden visual fragments for repeat visitors; never hide core navigation or content. |
| 26 | **Energy contour for sets** | M | M | M | Manual BPM/energy chapters linked to cue points; avoid unauthorized audio analysis/downloads. |
| 27 | **Smart QR campaign routes** | M | M | M | Flyer/venue-specific landing pages with coarse campaign attribution, no fingerprinting. |
| 28 | **WebGPU/spatial room prototype** | L/M | L | H | Campaign microsite only. WebGPU remains limited-availability; require WebGL/CSS/static fallback. |
| 29 | **Shareable signal artifact** | M | M | M | Generate an SVG/PNG still from a release’s approved visual/audio metadata after intentional playback; no server upload required. |
| 30 | **Local-input visual laboratory** | L/M | L | H | Optional campaign experiment for a visitor-owned file, processed entirely on-device with explicit permission, delete/reset controls, and no microphone requirement. |

### Priority

- **Migration release:** #1–#11 plus metadata/structured data.
- **First growth release:** #12–#21.
- **Campaign experiments:** #22–#30 only after field performance is healthy.

---

## 8. Link-hub architecture — dedicated `/link`, cinematic `/`

### Recommendation: the adaptive hybrid

Yes: create a dedicated, highly optimized Linktree-style route. The route should solve social-bio convenience without forcing every direct/search visitor through a utility gate.

```txt
/        canonical cinematic one-page Sölbo experience
/link    dedicated fast social/link-in-bio experience
/solbo   optional 308 alias to /link only if already printed/shared
```

Use `/link` in Instagram, TikTok, YouTube and similar bios. Let `/` begin directly with the cinematic artist-centered Hero. On the homepage, retain a small non-blocking `Links` or `Quick access` affordance for visitors who still want the hub.

### Why this is better than keeping the locked hub on `/`

| Model | Social-bio speed | Cinematic first impression | SEO clarity | Funnel measurement | Verdict |
|---|---:|---:|---:|---:|---|
| Locked utility scene on `/` | Medium | Weakens direct/search visits by adding a gate | Simple URL, mixed intent | Social and homepage traffic are blended | Do not keep as the default homepage state. |
| Separate `/link` and `/` | High | Preserves the full artist world | Clear | Clear `/link` → `/` funnel | Strong base. |
| Adaptive hybrid | Highest | Preserves homepage and keeps quick access available | Clear with explicit route policy | Best | **Recommended.** |

### “View site” behavior

`View site` should be a normal anchor to the homepage—not `history.back()` and not a fragile scroll return:

```html
<a href="/?entry=link" data-astro-prefetch="hover">View site</a>
```

This matters inside Instagram/TikTok browsers: `history.back()` may return to the social app. Normal navigation creates the predictable chain `social app → /link → /`; browser Back from the homepage returns to `/link`.

An Astro/native View Transition may dissolve the shared Sölbo wordmark from `/link` into the homepage Hero, but the route must work as a normal link without JavaScript or animation.

### `/link` visual direction

The dedicated page should not look like generic Linktree. Its **information architecture and presentation rhythm should closely follow [SimbaSōl on Komi](https://simbasol.komi.io/)**, while its palette, typography, corner language, motion and brand assets remain unmistakably Kev.Sun/Sölbo.

The live Komi reference was inspected directly. Its observed system is:

- a centered single-column application slab over a full-viewport background;
- desktop slab width around 736 px, 12 px outer radius and 48 px horizontal padding;
- large portrait first, then artist wordmark, social icons and horizontally scrollable section navigation;
- section order: New Releases → Music → Videos → Live Sets → Mix Series → Get in touch;
- 24 px/600 section headings with compact spacing and horizontal dividers;
- stacked release cards approximately 168 px high;
- 144 px square artwork overlapping the left side of a softer dark card body;
- card copy and small outlined action button aligned inside the right body area;
- later sections use horizontal carousels with visible next/previous controls and a clipped glimpse of the next card;
- large video thumbnails become landscape feature cards;
- booking/contact closes the same card system rather than introducing a separate footer design.

Preserve that structural clarity for Sölbo:

- portrait/logo and oversized identity rendered immediately;
- Sölbo grey field with **static or frozen film texture**, not the heavy Hero sequence;
- latest release and next show receive the first two large actions;
- music/social/booking links remain 44–48 px touch targets with real local icons;
- one clear `View cinematic site` CTA;
- optional tiny animated exposure only after first paint and only when motion is allowed;
- no autoplay audio, iframe, frame sequence, WebGL dependency or blocking custom cursor;
- system font or one very small preloaded WOFF2; one optimized image at most above the fold.

### Kev.Sun variation — close structure, original visual identity

An exact pixel copy plus one notch would still read as a Komi clone. The safer and stronger direction is to reproduce the **content hierarchy, card overlap logic, carousel rhythm and mobile convenience**, then make the complete surface Sölbo-specific:

- use a different Kev.Sun grey from the homepage Hero so `/link` feels related but purpose-built;
- retain the existing graphite/black/silver palette rather than Komi’s black panel and white default UI;
- use Neue Haas/Sölbo typography and the real local Sölbo wordmark instead of Inter/Komi styling;
- give every card one consistent **exposure notch**—a clipped top-right or lower-right corner of roughly 14–18 px;
- let artwork protrude from the opposite edge, creating a visual tension between image overlap and the missing corner;
- add a hairline coordinate/exposure mark inside the notch on featured cards;
- use a quiet grey-on-grey Thermal Memory bloom on hover/focus instead of Komi’s standard flat hover state;
- use rectangular/architectural controls rather than copying Komi’s fully pill-shaped buttons;
- let the final `View cinematic site` card transition from the grey hub into the homepage’s black/portrait world.

The notch is the primary geometry signature, but it is **not the only difference**. Palette, type, motion, iconography, button geometry and transition behavior together make the implementation original.

### Route policy

- `/` is indexable and canonical to itself.
- `/link` should normally use a self-canonical plus `noindex,follow`; it remains shareable and gets its own Open Graph image.
- Do not canonical `/link` to `/` unless the content becomes substantially duplicative.
- Do not serve identical live pages at both `/link` and `/solbo`; redirect the alias.
- Avoid user-agent sniffing that radically changes `/`. Social profiles should link explicitly to `/link`.

### Performance budget for `/link`

- HTML + CSS + JS initial transfer: **≤75 KB gzip**.
- Total initial page weight: **≤200 KB**.
- Client JavaScript: **0–20 KB gzip**.
- LCP target: **≤1.5 s mobile**; tap-ready in **≤1 s**.
- INP target: **≤100 ms**; CLS target: **≤0.02**.
- No third-party embeds or cinematic media preload on initial load.
- Intent-prefetch only the homepage document/poster; never eagerly fetch the full Hero sequence, WebGL, video or audio.

Track `link_page_view`, `link_click`, `view_site_click`, homepage `entry=link`, and `quick_links_opened`. Use explicit UTM variants for each social platform because in-app browsers may strip referrer data.

## 9. Hero/media architecture decision

### Recommended benchmark, not an assumption

Run Task 1.3 with three real-device candidates using the same source frames and target visual quality:

#### Candidate A — scrub-capable video

- Poster image in initial HTML.
- Muted `playsinline` video, `preload="metadata"` or `none` until near the Hero.
- H.264/MP4 baseline; optionally AV1/VP9 WebM source where measured support/bytes justify it.
- Scroll controls `currentTime`; rendering may use `requestVideoFrameCallback` where available.
- Encode frequent enough keyframes for seeking.

**Advantage:** usually far fewer requests and bytes than 193 JPEGs.  
**Risk:** random seeking and decode can be uneven on low-memory iOS/Android; exact frame fidelity depends on keyframe strategy.

#### Candidate B — progressive image sequence

- Real poster/final fallback in HTML.
- Resize source to measured rendered dimensions; do not ship 1176×1764 to every phone by default.
- Compare WebP and AVIF based on total bytes **and decode time**, not bytes alone.
- Load a small starter set first, then prioritized chunks around current scroll direction.
- Never wait for every frame; draw nearest decoded frame.
- Cap DPR and decoded-frame residency; release old ImageBitmaps where applicable.
- Serve immutable hashed chunks/manifests from static assets or R2.

**Advantage:** deterministic frame scrub and graceful nearest-frame fallback.  
**Risk:** many requests, high decoded memory, AVIF decode cost on weaker devices.

#### Candidate C — hybrid

- Short, high-value image sequence for the entry/lockup beat.
- Encoded video or much sparser sequence for the long background transition.

**Advantage:** keeps the signature “lean in” moment while controlling total cost.  
**Risk:** requires careful seam matching.

### Selection metrics

- first paint and first interaction before full media;
- initial bytes and total bytes;
- request count;
- LCP/INP/CLS;
- main-thread long tasks;
- peak decoded memory;
- visual frame error during fast scrub;
- Safari iOS, Chrome Android, desktop Chromium/WebKit;
- slow 4G and low-data path;
- failed/missing asset behavior;
- reduced-motion result.

Do not select an encoding from desktop byte size alone.

---

## 10. Signature visual system — Sölbo Exposure Memory

### What the two references are actually doing

**Lucky Done Gone background**

- Confirmed Three.js/WebGL fullscreen plane using `PlaneGeometry(2,2)` and `ShaderMaterial`.
- Inline fragment shader mixes simplex-noise color fields.
- Uniforms include `uTime`, `uScroll`, two colors and resolution.
- Slow RAF drift (`uTime`) and a small scroll influence create the cloudy motion.
- A separate noise PNG overlay supplies the tactile print/film grain.
- GSAP/ScrollTrigger/SplitText/Lenis handle blur/translate/opacity choreography around the background.

**HÖR Maximum Heat cursor**

- Confirmed Canvas2D implementation using `heatmap.js` / `h337`, not a WebGL fluid shader.
- The heatmap canvas is appended behind the page content.
- It renders at roughly one-third internal resolution and scales up 3× for cheaper soft blobs.
- Desktop mouse movement adds points; the original stores up to 1,000 points and expires them after 20 seconds.
- The original gradient runs blue → green/yellow → red; mobile injects random ambient points every 2.5 seconds.
- It clears/repaints on visibility changes, scrolling, resize and body-height changes.

### Recommended reinterpretation

Create one coherent material called **Exposure Memory**:

1. **Film Field:** a cold grey fullscreen shader behind the Hero and transition seams. Slow graphite/silver noise moves like light through smoke or unprocessed film. Scroll changes value and contrast, not rainbow hue.
2. **Thermal Memory:** pointer/touch/focus interactions leave blurred monochrome exposure stains behind transparent release/show surfaces. A pale cold-lime or low-saturation amber core appears only when crossing a real CTA.
3. **Portrait protection:** the artist remains visually clean through a soft mask/occlusion zone; movement may gather around the silhouette but should not paint over the face.
4. **Black-act translation:** as the page descends, the same exposure field inverts into faint silver ghosts on black instead of introducing a new effect.

This produces a consistent one-page system: **the environment remembers the visitor**, while Sölbo remains the center.

### Prototype choices

| Prototype | Technique | Best location | Estimated custom cost | Verdict |
|---|---|---|---:|---|
| Grey Thermal Bloom | Downscaled Canvas2D heat field | Music/show rows on grey and early black | 4–10 KB gzip | Build first; fastest proof of feel. |
| Sölbo Film Field | One fullscreen custom WebGL/OGL quad + tiny grain | Hero and grey→black seams | 15–35 KB gzip | Build second; strongest atmosphere. |
| Contact-Sheet Exposure Trail | Canvas mask aligned to cards/rows | Releases, booking and archive | 6–12 KB gzip | Optional refinement if round blooms feel too close to HÖR. |

Prefer custom WebGL or a tiny helper such as OGL over shipping Three.js for one fullscreen quad. The existing project’s Three/R3F packages should not survive the migration merely to reproduce this effect.

### Sölbo-specific trail limits

- Sample pointer movement at a bounded rate rather than every raw event.
- Target roughly 120–180 active points, not HÖR’s 1,000.
- Decay in 8–12 seconds, not 20 seconds.
- Render at 0.5–0.66 device resolution and scale softly.
- Desktop pointer/focus only by default; on touch, create one restrained bloom on deliberate tap rather than random perpetual mobile heat.
- Use `pointer-events:none`; the visual layer cannot become the interactive target.
- Keyboard focus must trigger an equivalent deterministic bloom and visible CSS focus ring.

### Lifecycle and acceptance

- Initialize per section with `IntersectionObserver`.
- Pause when offscreen, hidden, reduced-motion, low-data or coarse-pointer unless deliberate tap mode is enabled.
- Recompute after resize and ScrollTrigger refresh; clean up RAF, listeners, canvas and GL resources on route teardown.
- Film Field has a CSS layered-gradient + static grain fallback.
- Thermal Memory has a static hover/focus tint fallback.
- Combined custom effect JS target: **≤35 KB gzip**.
- No effect asset blocks the Hero poster/LCP.
- Target stable 60 fps desktop and a graceful capped 30 fps under throttle.
- No layout shift, input delay, click interception or loss of text contrast.
- Reduced motion freezes the Film Field and removes the decaying trail while preserving focus/hover clarity.

---

## 11. Future-proof Astro 7 + Cloudflare architecture

### Public site

- Astro 7 static-first pages and content collections/content layer.
- Zero React on public routes unless a measured exception is approved.
- Vanilla TypeScript modules for GSAP/ScrollTrigger, Lenis, embed gates, timezone formatting, player shell, and analytics.
- Route-scoped initialization and cleanup; one shared media-query/breakpoint source.
- Astro client router/view transitions only if multi-page continuity clearly benefits releases/sets/book pages. A one-page site does not need SPA behavior by default.

### Cloudflare target

- Prefer **Cloudflare Workers + static assets** for a new project, following current Cloudflare/Astro guidance.
- Use Worker routes only where dynamic behavior is justified: Keystatic auth/admin, smart links, `.ics`, private preview tokens, form relay, optional event logging.
- Use R2 for large campaign video, EPK ZIPs, press media, or set assets when repository/static delivery is unsuitable.
- Put public R2 media behind a custom domain when Cloudflare cache/WAF behavior is required; the development `r2.dev` path does not provide the same cache/WAF controls.
- Use Cloudflare Images or a measured build-time image pipeline for responsive artwork/press images and automatic format negotiation.
- Do not use KV as editorial source of truth; it is eventually consistent and better suited to high-read configuration/cache-like data.
- Do not add D1 until a real transactional/query requirement exists. Shows/releases remain Git-backed.
- Pin compatibility date, `nodejs_compat` need, Astro, adapter, Wrangler, and Node versions after the spike.

Current Worker limits are architecture inputs, especially for SSR/admin routes: 128 MB memory and bundle/CPU/subrequest ceilings vary by plan. Static asset requests do not carry the same Worker execution cost, which is another reason to keep the public experience static-first.

### CSP and transition compatibility

- Design for a strict Content Security Policy early rather than adding it after third-party scripts spread.
- Astro 7 CSP support is version-sensitive and currently has material constraints around external scripts/styles, `unsafe-inline`, Shiki, and Astro’s `<ClientRouter />`.
- Prefer native cross-document View Transitions for progressive MPA polish where supported.
- Use `<ClientRouter />` only if persistent player/client state genuinely requires it and the chosen CSP configuration is proven in the spike.
- Set `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options`, and intentional media/fullscreen permissions alongside CSP.

### Content model

Recommended Keystatic collections/singletons:

- `site`: identity, bio, booking, canonical domain, default social image, global links.
- `releases`: slug, state, date, artwork, label/catalog, credits, tracks, platform/buy links, campaign tokens, schema fields.
- `shows`: slug, state, venue, city/country, IANA timezone, doors/set/end time, lineup, tickets, RA, map, age policy, poster.
- `sets`: slug, date, event relation, source/embed, tracklist/cues, style/energy, rights notes.
- `press`: bios, photos, logos, riders, credits/licenses, quotes with source.
- `redirects`: stable old/campaign URLs to current canonical routes.

Keep cinematic sequence assets outside Keystatic.

### Media and runtime lifecycle

- Poster-first, progressive heavy media.
- Pause Canvas/WebGL/rAF loops with `IntersectionObserver` and `visibilitychange`.
- Respect `prefers-reduced-motion`, reduced data/user low-data toggle, coarse pointer, and device capability.
- WebGPU is campaign-only enhancement; WebGL2/CSS/static fallback is mandatory.
- Use the Media Capabilities API only as an optional hint when choosing codec/quality; retain deterministic source fallbacks.
- No sound until a user gesture. Give pause, stop, seek, volume, and visible current state.
- Third-party iframes load after intent.
- Use transform/opacity animation; avoid giant always-on `will-change` surfaces.

### Metadata and discovery

- canonical, Open Graph, Twitter cards, sitemap, robots, icons and theme color;
- `MusicGroup`/`Person` as appropriate for Sölbo identity;
- `MusicAlbum`/`MusicRecording` on release routes;
- `MusicEvent`/`Event` with valid location, status, time offset, performer and ticket offer URL;
- RSS/Atom for releases/shows/sets;
- stable URLs that survive visual redesigns.

### Analytics

Suggested events:

- `release_buy_bandcamp`
- `release_download_beatport`
- `release_listen_spotify`
- `embed_loaded`
- `show_ticket_click`
- `calendar_add`
- `booking_email_click`
- `epk_download`
- `low_data_enabled`

Cloudflare Web Analytics can provide lightweight RUM/site analytics; verify whether the chosen setup meets required custom-event reporting. Plausible/Fathom/Simple Analytics may be a clearer fit for first-party conversion events. Avoid remarketing pixels by default.

---

## 12. Choreography recommendations

### Hero

- Preserve the approved portrait and lockup.
- Keep the mobile first scene if it remains intentional, but ensure a keyboard/reduced-motion path cannot be trapped.
- Replace “wait for all frames” with poster-first readiness.
- Add one small changing `CURRENT SIGNAL` element: `MECCA · OUT NOW` or `NEXT · MONTRÉAL · 22:00`.
- The scroll cue should communicate progress/state, not run indefinitely as decoration.

### Music

- Lead with one featured release, not two mock platform players.
- Use local artwork/title/copy and explicit CTAs; click loads an official embed if requested.
- Give past releases a tactile catalog strip/grid with clickable cards and readable labels.
- Let artwork color seed subtle CSS variables for the section—no new shader per card.

### Shows

- Give the next event one larger row/card, then list the rest.
- Make the whole eligible row a clear target while preserving separate ticket semantics.
- Add map/calendar/RA only where data exists.
- Move past dates into an archive; do not render stale shows as upcoming.
- Replace automatic idle sweep with user-driven focus/hover emphasis and a reduced-motion-safe static state.

### Footer

- Keep booking email visible and increase contrast/target size.
- Add direct `/book` / `Download EPK` path.
- Let the wave field settle when offscreen, hidden, or reduced-motion.
- If a visitor has intentionally started an owned preview, allow the wave to inherit a restrained energy value; otherwise remain slow/static.

---

## 13. Phased roadmap mapped to the migration

### Before Checkpoint 1

1. Update target language from assumed Pages to a Workers-vs-existing-Pages decision, citing current official guidance.
2. Approve `/link` as the social hub and `/` as the direct cinematic homepage; remove the locked utility gate from the default homepage plan.
3. Add this research to architecture review; select the migration-release feature subset.
4. Benchmark Hero Candidates A/B/C on real mobile.
5. Prototype Grey Thermal Bloom and Sölbo Film Field separately before combining them.
6. Prove Keystatic auth/edit/commit/preview on the chosen Cloudflare topology.
7. Decide whether other public multi-page routes are in the initial release: recommended `releases/[slug]`, `book`, optional `sets/[slug]`.

### Foundation / static parity

1. Add one breakpoint token used by CSS and JS.
2. Define visual tokens plus `:focus-visible`, reduced-motion and low-data foundations.
3. Build the static `/link` route to its independent 200 KB page budget.
4. Extend content schemas now so future routes do not require destructive content rewrites.
5. Build semantic, clickable release and show components before motion.
6. Add metadata, canonical, JSON-LD, sitemap/robots, 404 and privacy surfaces.

### Motion/media parity

1. Poster-first Hero with progressive media and failure fallback.
2. One route-scoped GSAP/Lenis lifecycle.
3. Intersection/visibility pause for waves/shader/grain.
4. Reduced-motion parallel cut for every scene.
5. Click-to-load embeds and intentional audio only.

### First post-migration enhancement

1. Release dossier + first-party smart link.
2. Next-show/calendar/timezone states.
3. `/book` and EPK.
4. Set archive and optional persistent mini-player.
5. Privacy-friendly conversion dashboard.

### Campaign-only experiments

1. Audio-reactive owned-preview visuals.
2. Flyer constellation.
3. WebGPU/spatial room.
4. City/era visual tokens.

Each experiment must have a static fallback and its own performance/accessibility budget.

---

## 14. Acceptance targets

Retain the migration plan’s budgets and add product targets:

- critical listen/ticket/book action reachable without waiting for Hero media;
- no fake player controls or placeholder production links;
- no upcoming section containing past dates;
- release and show pages crawlable with JS disabled;
- public route zero React unless approved;
- third-party iframe not created before intent, except an explicitly approved case;
- all motion stops/degrades for reduced motion and when hidden/offscreen;
- every core action keyboard reachable with visible focus;
- 44 px preferred touch targets; WCAG 2.2 minimum target guidance met;
- one live URL, custom domain, SSL, redirect, and broken-link monitor owned by client;
- outbound listen/buy/ticket/book actions measurable without ad-tech by default.
- `/link` meets its 200 KB initial page-weight budget and never preloads the heavy Hero sequence.
- Exposure Memory uses the approved Sölbo palette and cannot be confused visually with HÖR’s rainbow heatmap or Lucky Done Gone’s cream/red identity.
- cursor/focus effects never paint over the artist’s face or reduce portrait hierarchy.

---

## 15. Official source index

### Astro / Cloudflare

- Astro 7 upgrade: https://docs.astro.build/en/guides/upgrade-to/v7/
- Astro npm current: https://registry.npmjs.org/astro/latest
- Astro Cloudflare adapter npm current: https://registry.npmjs.org/%40astrojs%2Fcloudflare/latest
- Wrangler npm current: https://registry.npmjs.org/wrangler/latest
- Astro islands: https://docs.astro.build/en/concepts/islands/
- Astro server islands: https://docs.astro.build/en/guides/server-islands/
- Astro content collections: https://docs.astro.build/en/guides/content-collections/
- Astro images: https://docs.astro.build/en/guides/images/
- Astro view transitions: https://docs.astro.build/en/guides/view-transitions/
- Astro pages/routing: https://docs.astro.build/en/basics/astro-pages/
- Astro prefetch: https://docs.astro.build/en/guides/prefetch/
- Astro Cloudflare deployment: https://docs.astro.build/en/guides/deploy/cloudflare/
- Astro Cloudflare adapter: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Static assets: https://developers.cloudflare.com/workers/static-assets/
- Static asset routing: https://developers.cloudflare.com/workers/static-assets/routing/
- Static asset headers: https://developers.cloudflare.com/workers/static-assets/headers/
- R2: https://developers.cloudflare.com/r2/
- R2 and Cloudflare cache behavior: https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/
- Images: https://developers.cloudflare.com/images/
- KV: https://developers.cloudflare.com/kv/
- D1: https://developers.cloudflare.com/d1/
- Web Analytics: https://developers.cloudflare.com/web-analytics/

### Music ecosystem

- Bandcamp Artist Guide: https://bandcamp.com/guide
- Bandcamp Fair Trade Music Policy: https://bandcamp.com/fair_trade_music_policy
- Beatport API docs: https://api.beatport.com/v4/docs/
- Resident Advisor Tickets: https://ra.co/tickets
- Resident Advisor Terms: https://ra.co/terms
- SoundCloud API guide: https://developers.soundcloud.com/docs/api/guide
- SoundCloud oEmbed: https://developers.soundcloud.com/docs/oembed
- SoundCloud Widget API: https://developers.soundcloud.com/docs/api/html5-widget
- SoundCloud rate limits: https://developers.soundcloud.com/docs/api/rate-limits
- Spotify Embeds: https://developer.spotify.com/documentation/embeds
- Spotify Web API rate limits: https://developer.spotify.com/documentation/web-api/concepts/rate-limits
- Spotify scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
- Songkick API: https://www.songkick.com/developer
- Ticketmaster APIs: https://developer.ticketmaster.com/products-and-docs/apis/getting-started/
- MusicBrainz API: https://musicbrainz.org/doc/MusicBrainz_API

### Web platform, performance, accessibility, privacy

- Web Audio: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Media Capabilities: https://developer.mozilla.org/en-US/docs/Web/API/Media_Capabilities_API
- `requestVideoFrameCallback`: https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback
- Autoplay guide: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
- WebGL: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- WebGPU: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- Media Session: https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
- `Intl.DateTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
- `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- Web video codecs: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Video_codecs
- Astro CSP configuration: https://docs.astro.build/en/reference/configuration-reference/#securitycsp
- Core Web Vitals: https://web.dev/articles/vitals
- Google canonical guidance: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google robots/noindex guidance: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- MDN Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- MDN bfcache: https://developer.mozilla.org/en-US/docs/Glossary/bfcache
- Google Event structured data: https://developers.google.com/search/docs/appearance/structured-data/event
- Schema.org MusicEvent: https://schema.org/MusicEvent
- Schema.org MusicAlbum: https://schema.org/MusicAlbum
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WCAG Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- WCAG Audio Control: https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html
- WCAG Target Size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- ICO cookies guidance: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/

---

## Final recommendation

Do not spend the migration budget making the current page merely lighter, and do not use the migration as an excuse to redesign everything at once.

**Ship parity with a stronger cinematic spine:** a dedicated instant `/link` poster for social traffic; a direct artist-centered cinematic homepage; poster-first Hero media; real linked releases and show states; and the first two pieces of the **Exposure Memory** material system. Then extend that world into the Sölbo Night Archive—release/set dossiers whose artwork, notes, tracklists, dates, cursor traces and intentional playback inhabit the same grey-to-black visual language.

This is not a recommendation to make Sölbo minimalist. It is a recommendation to make the maximal cinematic work coherent: one portrait-centered film, one evolving material system, one unmistakable route through Listen, Shows and Book.
