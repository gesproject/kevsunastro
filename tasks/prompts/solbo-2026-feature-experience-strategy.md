# Sölbo 2026+ Feature & Experience Strategy

Research date: 23 July 2026. Scope: underground electronic/DJ/producer site with existing mobile link-in-bio intro, cinematic hero frame scrub, releases, players, shows, booking email, social links, waves/shader. Planned stack: Astro 7, vanilla CSS/TS, Keystatic, Cloudflare.

## Executive strategy

Sölbo’s site should not try to replace Bandcamp, Beatport, Resident Advisor, SoundCloud, Spotify, or ticketing platforms. It should be the **fast, ownable conversion layer** between fragmented music ecosystems:

1. **Fans** need: listen fast, buy/support, save/follow, know where to go tonight, get reminders, and revisit sets.
2. **DJs/heads** need: Bandcamp/Beatport links, track/release context, catalog credibility, live set archive, and proof of scene fit.
3. **Bookers/promoters** need: one-page proof, contact, territories, dates, press shots, tech/rider, recent sets, audience/social links, and clean handoff.
4. **Algorithms/platforms** need: crawlable pages, structured data, fast mobile performance, canonical links, and no fragile scraping.

The defensible position is: **first-party pages + platform-native CTAs + privacy-respecting measurement + restrained interactive atmosphere**. Treat Web Audio/shaders/spatial scenes as enhancement, never as the path to tickets, booking, or music purchase.

---

## 1. Ecosystem constraints and implications

| Ecosystem | What it is best for | Constraints / caveats | Sölbo-site implication |
|---|---|---|---|
| **Bandcamp** | Direct-to-fan purchases, merch, vinyl/digital, artist story, embeddable players. Bandcamp states revenue share of 15% digital and 10% physical, with payment processor fees separate and remainder usually 80–85% to artist/label. | Do not scrape or rehost catalog assets without permission. Use official embeds/links. Not a general-purpose public music metadata API. | Make Bandcamp the primary **support/buy** CTA on release pages. Use embeds lazily. Add `Buy / support` before passive streaming links. |
| **Beatport** | DJ credibility, genre positioning, downloads/charts for electronic music. Beatport API docs exist, but production access/usage should be treated as gated and terms-bound. | Public site may block bots; avoid scraping charts, previews, prices, or metadata. Use official artist/release links maintained in CMS. | Use Beatport as a **DJ/download** CTA, not as a data source. Store release URLs manually in Keystatic. |
| **Resident Advisor** | Underground electronic event discovery/ticketing trust. RA Tickets page positions RA for electronic music events and promoter tooling; terms prohibit unauthorized automated access including bots, spiders, crawlers, or scrapers. | No assumption of public event API. No scraping of RA listings/tickets. Tickets, availability, resale states remain on RA/venue/ticket platform. | Event pages should link out to RA/ticket URL, track outbound conversion first-party, and keep manually entered canonical event data. |
| **SoundCloud** | Discovery, premieres, live sets, remixes, social embedding. Official API, oEmbed, and Widget API exist. Rate limits include HTTP 429 on excess use; play stream requests are documented as 15,000 per 24-hour window. | API key required; comply with attribution/branding/terms. Third-party iframes are privacy/performance costs. Cross-origin iframe audio cannot reliably feed custom Web Audio analyzers. | Use SoundCloud embeds for sets but lazy-load on intent. For archives, prefer first-party set pages with SoundCloud oEmbed/Widget enhancement. |
| **Spotify** | Mainstream social proof, saves/follows, playlist context, embeddable albums/tracks. Web API, embeds, scopes, and rate-limit docs are official. Rate limit is based on a rolling 30-second window. | Pre-save/save requires OAuth and `user-library-modify` / library scopes; users must knowingly authorize. Developer terms/policy govern branding, content use, quotas, and commercial use. Do not imply Spotify endorsement. | Use Spotify as **Listen/save** CTA, not primary direct-to-fan revenue. For pre-save, either use a reputable smart-link provider or a transparent first-party OAuth flow. |
| **Smart-link providers** | Linkfire, Feature.fm, Show.co and similar tools solve platform detection, pre-save campaigns, remarketing, and dashboards. | Often rely on cookies, pixels, redirects, data sharing, and processor terms. Retargeting pixels generally require consent in EU/UK contexts. | Prefer a first-party lightweight smart-link page by default; use provider campaigns only when the marketing need justifies privacy/legal overhead. |

---

## 2. Must-have conversion infrastructure

These are not art-direction experiments; they are the site’s commercial and operational backbone.

### A. Mobile-first conversion shell

- Persistent but quiet mobile bottom bar: **Listen**, **Buy**, **Shows**, **Book**.
- Next-show card above the fold when a date is upcoming: city, venue, local date/time, user-local time, ticket status, `Add to calendar`, RA/ticket CTA.
- Release launch state machine: `announced → pre-save/pre-order → out now → archive`.
- Lazy platform embeds behind click-to-load cards to reduce page weight and third-party tracking before consent/intent.

### B. Release pages as canonical dossiers

Each release should have a permanent URL with:

- title, artwork, date, label/self-release, catalog number if any, track list, credits, mastering, artwork credits;
- Bandcamp buy/support CTA;
- Beatport DJ/download CTA where applicable;
- Spotify / Apple / SoundCloud / YouTube Music / Deezer links via CMS;
- short artist note, recommended listening context, press quote if real;
- JSON-LD for music entities (`MusicAlbum`, `MusicRecording`, `MusicGroup` where appropriate);
- share image and canonical URL.

### C. First-party smart links and pre-save policy

Build a `/r/[slug]` or `/listen/[slug]` resolver that:

- shows platform buttons instead of immediate opaque redirect;
- preserves UTM parameters;
- logs privacy-safe click events server-side or via privacy analytics;
- detects platform preference only through explicit user choice or coarse device hints, not invasive fingerprinting;
- can mark `Buy on Bandcamp` as the first CTA for D2F releases and `Pre-save on Spotify` as optional.

For Spotify pre-save, use one of two modes:

1. **Provider mode**: Linkfire/Feature.fm/Show.co if campaign retargeting, label coordination, or Spotify/Apple OAuth handling is worth vendor data processing.
2. **First-party mode**: OAuth flow that clearly says: “Authorize Sölbo site to save this release to your Spotify library when available.” Store the minimum token data, provide revocation/deletion info, and do not bundle unrelated permissions.

### D. Shows and tickets conversion

For each show:

- local date/time with timezone offset in data (`2026-10-31T23:00:00+01:00`);
- user-local equivalent via `Intl.DateTimeFormat`;
- venue, city, country, age policy, lineup/slot time if confirmed;
- ticket URL and fallback “announce me / remind me” email capture if ticket URL not live;
- RA link if listed, venue link, maps link;
- ticket states: `announced`, `on sale`, `low`, `sold out`, `cancelled`, `postponed`;
- `Add to Apple/Google/Outlook calendar` via `.ics` generated from CMS data;
- JSON-LD `Event`/`MusicEvent` with `location`, `offers.url`, `performer`, `organizer`, `eventStatus`.

Important Google caveat: Google’s Event rich result guidelines emphasize physical-location events and timezone offsets; use valid `location`/`offers` and validate with Rich Results Test.

### E. Booking / EPK infrastructure

A booker should be able to evaluate Sölbo in under 90 seconds:

- `/book` page with booking email, territory/availability note, short bio, long bio download, press photos, logo/wordmark, tech rider, hospitality rider if relevant, stage/DJ setup, current links;
- 2–3 representative sets with context: club/festival, date, energy, BPM range, style notes;
- “Copy booking one-sheet” and “Download EPK ZIP”;
- optional form that still reveals direct email. Never hide booking behind a fragile form.

### F. Privacy-friendly measurement

Measure conversion without turning the site into ad-tech:

- page views and outbound clicks via Plausible, Fathom, Simple Analytics, or Cloudflare Web Analytics;
- custom events: `release_buy_bandcamp`, `release_listen_spotify`, `show_ticket_click`, `booking_email_click`, `epk_download`, `calendar_add`, `embed_loaded`;
- no Meta/TikTok/Google remarketing pixels by default;
- marketing pixels only behind consent by region and campaign need;
- server-side redirect logs should hash or truncate IPs and avoid long-lived user IDs unless consented.

### G. Accessibility/performance baseline

- WCAG 2.2 AA target.
- No autoplay sound; any audio over 3 seconds needs pause/stop/volume control.
- Motion/shaders/frame scrub must obey `prefers-reduced-motion`, expose pause/disable, and avoid flashes/strobes.
- Keyboard-visible focus for all CTAs, players, carousels, and menus.
- Touch targets at least WCAG 2.2 target-size guidance where possible.
- Captions/transcripts/tracklists for live-set archives where feasible.
- Low-data mode for club Wi‑Fi and older phones.

---

## 3. Art-direction experiments: allowed, but below the conversion layer

Experiments should be opt-in, progressive, and reversible. Recommended rule: **content first, atmosphere second, hallucination never**.

Good fits for Sölbo’s underground electronic aesthetic:

- monochrome/low-saturation cinematic visuals;
- restrained shader/wave systems tied to scroll or user-triggered audio previews;
- archive-as-club-memory rather than generic portfolio grid;
- night-time typography, tactile flyers, subdued spatial parallax;
- hidden details for repeat visitors, but no mystery-meat navigation.

Avoid:

- SaaS hero clichés, fake metrics, generic “join the movement” copy;
- autoplaying music or seizure-risk visuals;
- full-screen WebGL that blocks tickets/booking;
- scraping platform data to create brittle “live” pages;
- dark-pattern pre-save flows that request broad OAuth permissions.

---

## 4. Feature concepts with impact / effort / risk

Impact: H/M/L for Sölbo conversion/brand value. Effort: S/M/L. Risk covers legal, privacy, accessibility, platform, or performance.

| # | Concept | Type | Impact | Effort | Risk | Notes |
|---:|---|---|---|---|---|---|
| 1 | **Next-night conversion card** | Must-have | H | S | L | Auto-prioritizes next show with ticket/RA/calendar CTAs in local + user timezone. |
| 2 | **First-party smart-link resolver** | Must-have | H | M | M | Privacy-safe platform chooser with UTM/outbound analytics; avoids unnecessary ad-tech. |
| 3 | **Bandcamp-first support strip** | Must-have | H | S | L | “Buy/support direct” component appears before passive streaming on eligible releases. |
| 4 | **Release dossier pages** | Must-have | H | M | L | Permanent SEO/social pages with credits, CTAs, structured data, and embed-on-intent players. |
| 5 | **Booking one-sheet generator** | Must-have | H | M | L | `/book` page can render downloadable PDF/print one-sheet from Keystatic data. |
| 6 | **EPK ZIP builder** | Must-have | H | M | M | Downloads current press shots, bios, logo, rider. Risk: keep assets licensed/current. |
| 7 | **Outbound conversion event map** | Must-have | H | S | L | Tracks ticket/buy/listen/book clicks in privacy-friendly analytics. |
| 8 | **Show state machine** | Must-have | H | M | L | Announced/on sale/low/sold out/cancelled/postponed/archive states avoid stale pages. |
| 9 | **Calendar pack** | Must-have | M | S | L | One-click `.ics` per show and “subscribe to shows” feed. |
| 10 | **Structured-data compiler** | Must-have | M | M | M | Generates JSON-LD for events/releases/artist; risk is invalid markup if CMS data incomplete. |
| 11 | **Lazy embed consent/intention gate** | Must-have | M | S | L | Loads Spotify/SoundCloud/Bandcamp iframes only after user intent; improves performance/privacy. |
| 12 | **Live-set archive with cue chapters** | Conversion + brand | H | M | M | First-party pages for sets with SoundCloud embed, tracklist/cues, event context. Licensing caveat for tracklists/downloads. |
| 13 | **Promoter route view** | Booking | M | M | L | Bookers see upcoming region clusters and “hold inquiry” email template. Avoid exposing private holds. |
| 14 | **Multilingual city microcopy** | Conversion | M | M | L | EN default plus localized show/booking snippets for key markets; don’t machine-translate legal copy blindly. |
| 15 | **Timezone-aware “doors vs set time” display** | Conversion | M | S | L | Separates doors, lineup, Sölbo set time; prevents travel/show confusion. |
| 16 | **RSS/email drop feed** | D2F | H | M | M | Ownable fan relationship for releases/shows/sets. Consent, unsubscribe, sender identity required. |
| 17 | **Post-show afterglow page** | D2F + archive | M | M | M | 24–72h recap: set embed, photo/flyer, thank-you, next city CTA. Rights/privacy for photos. |
| 18 | **Offline PWA “crate”** | Utility/art | M | M/L | M | Saves press kit, selected release cards, upcoming shows for poor club Wi‑Fi. Embedded streams won’t work offline. |
| 19 | **Media Session-enhanced set player** | Utility | M | M | M | If hosting own audio snippets, add lock-screen metadata/controls. Rights/autoplay caveats. |
| 20 | **Audio-reactive wave/shader only on owned preview loop** | Art | M | M | M | Use Web Audio analyzer on self-hosted cleared snippets; cannot rely on third-party iframe audio. |
| 21 | **Reduced-motion parallel cut** | Accessibility/art | H | S/M | L | Separate restrained visual language for users who disable motion; not just “turn everything off.” |
| 22 | **Flyer constellation archive** | Art/archive | M | M | M | Past gigs/releases become a navigable night-sky/club-wall. Need alt text and non-canvas fallback list. |
| 23 | **City-frequency visual theme** | Art | M | M | M | Subtle per-city palette/noise seeded by venue/timezone, not geolocation tracking. |
| 24 | **Dubplate signal easter eggs** | Art/fan | L/M | S | M | Hidden non-critical fragments/visual motifs for repeat fans. Avoid hiding CTAs/navigation. |
| 25 | **Low-data club mode** | Utility | M | S | L | User toggle strips shaders/embeds, keeps tickets, booking, and release links fast. |
| 26 | **Press quote provenance cards** | Booking | M | S | L | Every quote links to source/context; prevents fake social proof. |
| 27 | **Smart QR landing variants** | Conversion | M | M | M | QR on flyers routes to show/release-specific page; do not fingerprint users. |
| 28 | **WebXR/spatial listening room prototype** | Art experiment | L/M | L | H | Only for campaign microsite; high device/accessibility/performance risk. Must not gate music/tickets. |
| 29 | **Interactive “set energy contour”** | Archive/art | M | M | M | Manual energy/BPM curve with chapter links, not automated copyrighted audio analysis unless rights allow. |
| 30 | **Booker-safe private preview links** | Booking | M | M | M | Tokenized unlisted pages for unreleased clips/EPK; expire links and watermark if needed. |

Priority recommendation:

- **Phase 1**: #1–#11, #15, #21, #25.
- **Phase 2**: #12–#19, #26, #27, #30.
- **Phase 3 / campaign-only**: #20, #22–#24, #28–#29.

---

## 5. Implementation shape for Astro / Keystatic / Cloudflare

### Content model

Keystatic collections:

- `releases`: slug, status, date, artwork, credits, platformLinks, buyLinks, tracklist, schema fields.
- `shows`: slug, status, city, country, venue, timezone, doors, setTime, endTime, lineup, ticketUrl, raUrl, price, currency, agePolicy, poster, promoter, coordinates optional.
- `sets`: slug, date, sourcePlatform, embedUrl, eventRelation, tracklist/cues, mood tags, rights notes.
- `links`: platform name, URL, priority, campaign, UTM defaults.
- `pressAssets`: bios, photos, rider, logo, social proof, quotes with source URLs.
- `translations`: UI labels and localized show microcopy.

### Cloudflare architecture

- Static Astro output on Cloudflare Pages.
- Cloudflare Functions/Workers for: smart-link redirects, `.ics` generation, lightweight event logging, form-to-email/webhook if needed.
- Cloudflare Web Analytics or privacy analytics script loaded without cookies; custom outbound events if supported by chosen provider.
- Cache platform link pages aggressively; never cache user OAuth responses.

### Front-end rules

- Vanilla TS for player wrappers, embed gates, timezone formatting, calendar generation, reduced-motion controls.
- CSS-first visuals; Canvas/WebGL only below feature detection and performance guard.
- Keep hero frame scrub as decorative: content must be readable without it.

---

## 6. Legal, accessibility, and privacy caveats

### Platform/legal

- **Do not scrape RA, Beatport, Spotify, SoundCloud, or Bandcamp** for listings, charts, metadata, or previews unless explicitly allowed. RA terms specifically prohibit automated access such as bots/spiders/crawlers/scrapers except standard search engine technologies.
- **Pre-save is consent-heavy**: Spotify saves require OAuth scope and user understanding. Keep permission copy explicit, narrow, and revocable.
- **Live-set archive rights**: Embedding from SoundCloud is safer than hosting downloadable mixes. If hosting audio, confirm rights for all tracks, samples, artwork, and visualizers. Tracklists are useful but can raise takedown/rights attention if paired with unauthorized downloads.
- **Press photos/flyers**: Store photographer/designer credits and license notes in CMS.

### Privacy

- EU/UK cookie and direct marketing regimes treat many analytics/advertising pixels and email/SMS marketing as consent/notice issues. Use data minimization, clear privacy notice, unsubscribe, and no pre-ticked boxes.
- Privacy-friendly analytics are not a complete exemption from all privacy duties, but tools that avoid cookies/personal data reduce consent-banner burden.
- If using Linkfire/Feature.fm/Show.co retargeting, document vendors, pixels, retention, and regional consent behavior.

### Accessibility

- WCAG 2.2 AA should be the acceptance target.
- No autoplay sound. If audio plays automatically for more than 3 seconds, WCAG requires a mechanism to pause/stop/control volume; better: never autoplay.
- Motion/animation that starts automatically must be pausable/stoppable/hidden if it lasts more than 5 seconds or distracts. Provide `prefers-reduced-motion` support.
- Avoid three-flash/strobe risk. Underground visuals can feel intense without violating seizure guidance.
- All canvas/WebGL visualizations require textual/list alternatives.

---

## 7. Source URLs

Platform and music ecosystem:

- Bandcamp Artist Guide: https://bandcamp.com/guide
- Bandcamp Fair Trade Music Policy: https://bandcamp.com/fair_trade_music_policy
- Bandcamp Terms of Use: https://bandcamp.com/terms_of_use
- Beatport API docs: https://api.beatport.com/v4/docs/
- Resident Advisor Tickets: https://ra.co/tickets
- Resident Advisor Terms: https://ra.co/terms
- Resident Advisor Privacy: https://ra.co/privacy
- SoundCloud API guide: https://developers.soundcloud.com/docs/api/guide
- SoundCloud oEmbed: https://developers.soundcloud.com/docs/oembed
- SoundCloud Widget API: https://developers.soundcloud.com/docs/api/html5-widget
- SoundCloud rate limits: https://developers.soundcloud.com/docs/api/rate-limits
- SoundCloud API terms: https://developers.soundcloud.com/docs/api/terms-of-use
- Spotify Embeds: https://developer.spotify.com/documentation/embeds
- Spotify Web API: https://developer.spotify.com/documentation/web-api
- Spotify rate limits: https://developer.spotify.com/documentation/web-api/concepts/rate-limits
- Spotify scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
- Spotify Save Tracks / library scope reference: https://developer.spotify.com/documentation/web-api/reference/save-tracks-user
- Spotify Developer Terms: https://developer.spotify.com/terms
- Spotify Developer Policy: https://developer.spotify.com/policy
- Spotify for Artists display campaigns: https://artists.spotify.com/marquee
- Spotify Countdown Pages: https://artists.spotify.com/countdown-pages
- Linkfire: https://linkfire.com/
- Feature.fm: https://feature.fm/
- Show.co: https://show.co/
- Songkick developer API: https://www.songkick.com/developer
- Ticketmaster Developer APIs: https://developer.ticketmaster.com/products-and-docs/apis/getting-started/
- Apple Music API: https://developer.apple.com/documentation/applemusicapi
- MusicBrainz API: https://musicbrainz.org/doc/MusicBrainz_API

Web platform / implementation:

- Astro view transitions: https://docs.astro.build/en/guides/view-transitions/
- Astro Cloudflare adapter: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Keystatic Astro installation: https://keystatic.com/docs/installation-astro
- Cloudflare Pages: https://www.cloudflare.com/developer-platform/products/pages/
- Cloudflare Web Analytics: https://developers.cloudflare.com/web-analytics/
- MDN Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MDN WebGL API: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- MDN WebGPU API: https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- MDN Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- MDN OffscreenCanvas: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
- MDN Progressive Web Apps: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- web.dev Learn PWA: https://web.dev/learn/pwa
- MDN Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- MDN Media Session API: https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API
- MDN Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API
- MDN `Intl.DateTimeFormat`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
- MDN `prefers-reduced-motion`: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- web.dev Web Vitals: https://web.dev/articles/vitals

Structured data / SEO:

- Google Event structured data: https://developers.google.com/search/docs/appearance/structured-data/event
- Schema.org `MusicEvent`: https://schema.org/MusicEvent
- Schema.org `MusicAlbum`: https://schema.org/MusicAlbum
- Schema.org `MusicGroup`: https://schema.org/MusicGroup

Privacy and accessibility:

- Plausible data policy: https://plausible.io/data-policy
- Plausible privacy-focused analytics: https://plausible.io/privacy-focused-web-analytics
- Fathom privacy-focused analytics: https://usefathom.com/privacy-focused-web-analytics
- Simple Analytics: https://www.simpleanalytics.com/
- ICO cookies and similar technologies: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/
- CNIL cookies/tracking guidelines: https://www.cnil.fr/en/cookies-and-other-tracking-devices-cnil-publishes-new-guidelines
- GDPR/ePrivacy cookie overview: https://gdpr.eu/cookies/
- FTC CAN-SPAM guide: https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WCAG Audio Control: https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html
- WCAG Pause, Stop, Hide: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- WCAG Three Flashes or Below Threshold: https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html
- WCAG Target Size Minimum: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
