# Sölbo reference research: underground electronic-music websites + digital artist experiences

Research date: **2026-07-23** local time (WSL check: `2026-07-23T23:36:30-04:00`; HTTP headers often show 2026-07-24 UTC).
Verification method: Playwright/Chromium visits, screenshots, DOM text extraction, link/media/control counts, and selected Awwwards pages. I distinguish **direct observation** (what the live page exposed in the browser/HTML) from **inference** (why the pattern may work for Sölbo). Screenshots and audit JSON were saved under `/tmp/solbo-web-research/`.

## Findings table

### 1) Max Cooper — artist / audiovisual album archive
- **URL:** https://maxcooper.net/
- **Reachability:** HTTP 200, title `Max Cooper – Home`; source date visible in footer: `© Max Cooper 2026`; footer also says `Made by Engine`.
- **Direct observation:** Left-side vertical/minimal nav: `ABOUT`, `WORKS`, `EVENTS`, `JOURNAL`, `STORE`, `CONTACT`, `JOIN`. Landing view is a white editorial archive with project tiles/artwork; visible copy includes `Feeling Is Structure`, `The Shape Of Memory`, `Audio-visual album projects`, and distribution links/hints for Spotify, SoundCloud, Bandcamp, YouTube, Vimeo. It is text/project-led rather than linktree-led.
- **Why relevant:** Closest benchmark for an electronic producer treating releases as cinematic audiovisual works, not just tracks.
- **Adapt without copying:** Convert Sölbo’s release grid into a “works as chapters” editorial archive: each release/show/visual gets a tiny synopsis + one dominant image/loop + platform links, with a persistent low-key nav.
- **Inference:** The site positions Max Cooper as a system/visual-art practice; Sölbo can borrow that framing to make the scroll-scrub portrait feel like part of a larger audiovisual language.

### 2) Floating Points — artist / release-focused one-pager
- **URL:** https://floatingpoints.co.uk/
- **Reachability:** HTTP 200, title `Floating Points - Mere Mortals`; visible 2026 tour dates include `31 JUL 2026`, `08 AUG 2026`.
- **Direct observation:** Full-bleed dark red hero for `MERE MORTALS`; top nav `STORE`, `TOUR`, `WATCH`, `SIGN UP`; primary CTAs `EXPLORE MERE MORTALS` and `LISTEN NOW`; down-arrow suggests scroll; mailing-list section and cookies prompt.
- **Why relevant:** A cinematic one-page artist site with a single current release/story and direct conversion paths.
- **Adapt without copying:** Use Sölbo’s locked/mobile intro and portrait hero as the “single current world,” then expose two decisive CTAs: listen / upcoming shows. Keep secondary pages hidden in sticky micro-nav.
- **Inference:** Works because the hero is emotionally specific and avoids overloading the first viewport.

### 3) Nicolas Jaar / Jaar Music Archive — experimental artist archive
- **URL:** https://nicolasjaar.net/ redirects to https://www.jaar.site/
- **Reachability:** HTTP 200, title `Jaar Music Archive`.
- **Direct observation:** Very sparse white page, small centered text links, almost no images; visible latest entry `ARCHIVOS DE RADIO PIEDRAS (2020-2024)` with a long textual description and Bandcamp availability; ~104 links; tech scan hinted Astro.
- **Why relevant:** Shows that an underground electronic identity can feel premium through restraint, archival depth, and typography rather than heavy visuals.
- **Adapt without copying:** Add an “archive mode” or hidden chronological index below Sölbo’s cinematic sections: mixes, tracks, shows, photos, and notes as compact text rows.
- **Inference:** Useful counterweight to Sölbo’s motion-heavy hero; gives super-fans a credible research layer.

### 4) Caterina Barbieri — experimental/synth artist
- **URL:** https://caterinabarbieri.com/
- **Reachability:** HTTP 200, title `Caterina Barbieri`.
- **Direct observation:** Above fold: sunset/water photograph, small logo/mark, top-right nav (`ABOUT`, `MUSIC`, `LIVE`, `STORE`), side micro-labels (`BANDCAMP`, `INSTAGRAM`, `IMAGES`). DOM shows long repeated track-title ribbons such as `Memory Leak`, `Math of You`, `Myuthafoo`, `Alphabet of Light`, `Sufyosowirl`, `Swirls of You`.
- **Why relevant:** Elegant, experimental-musician site with image-as-atmosphere and text-as-pattern.
- **Adapt without copying:** Use Sölbo’s track/release titles as low-opacity kinetic ribbons during the grey-to-black transition or around the footer waves.
- **Inference:** The repeated track names behave like a typographic sequencer; Sölbo can use release metadata as visual rhythm.

### 5) Ryoji Ikeda — audiovisual/data artist
- **URL:** https://www.ryojiikeda.com/
- **Reachability:** HTTP 200, title `ryoji ikeda | news`.
- **Direct observation:** Stark white page with compact top nav: `news`, `works`, `exhibitions`, `performances`, `acoustic concerts`, `recordings`, `collaborations`, `publications`, `biography`, `contact`, `shop`. Visible rows include works like `test pattern`, `datamatics`, `superposition`, plus years including 2025, 2020, 2018, etc.
- **Why relevant:** Canonical electronic/audio-visual minimalism; excellent for anti-decoration discipline.
- **Adapt without copying:** Use one “data strip” component for Sölbo shows/releases: date, city, venue, format, media link; keep motion reserved for hero/footer, not every list.
- **Inference:** The authority comes from catalog clarity and typographic hierarchy, not visual noise.

### 6) Arca — experimental artist / official release store
- **URL:** https://arca1000000.com/
- **Reachability:** HTTP 202 but rendered; title `Arca`.
- **Direct observation:** Product/drop interface for `XXXXX Arca XL1662`; visible `31 July 2026`, `Download Pre-order USD 9.99`, format picker `MP3 WAV / FLAC`, `Add to Basket`, audio `Play`, and product stack for vinyl/downloads.
- **Why relevant:** Not a generic pop-star site; it is a release commerce layer with audio preview and format choice.
- **Adapt without copying:** For Sölbo releases, present one featured release as a “drop card”: cover art, short audio preview, streaming/buy buttons, and format/status badges.
- **Inference:** Commerce can feel underground if it is integrated as a minimal artifact/product system rather than a loud merch shop.

### 7) Ilian Tape — label / underground techno-electronic ecosystem
- **URL:** https://iliantape.de/
- **Reachability:** HTTP 200, title `Ilian Tape`.
- **Direct observation:** Dark label homepage with nav `NEWS`, `RELEASES`, `ARTISTS`, `PODCAST`, `VIDEO`, `SHOP`; visible release `ITX045 MPU101 – MPU107 Radiating Cellular Lime Headlight`; external links to shop/Bandcamp/Hard Wax/Juno/Clone/Deejay; embedded media hints.
- **Why relevant:** Munich label aesthetic: functional, deep catalog, no glossy overbranding.
- **Adapt without copying:** Sölbo grid cards can include “where to listen/buy” micro-links inline, not buried in modal embeds.
- **Inference:** Underground credibility improves when the site acknowledges ecosystem touchpoints (Bandcamp, Hard Wax, mixes) without a corporate streaming hierarchy.

### 8) Hessle Audio — label / restrained archive
- **URL:** https://hessleaudio.com/
- **Reachability:** HTTP 200 when Chromium ignores a certificate-name issue; title `Hessle Audio`.
- **Direct observation:** Very sparse interface; repeated nav `HOME`, `DISCOGRAPHY`, `BANDCAMP`, `CONTACT`; only ~15 links but multiple iframes/embeds and visual cover/art area.
- **Why relevant:** Shows the opposite of overbuilt label sites: direct path to discography and Bandcamp.
- **Adapt without copying:** Keep Sölbo’s music section navigable without JS: a simple discography fallback with embedded players as enhancements.
- **Inference:** “Small, durable, useful” is a valuable benchmark for the Astro/zero-React migration.

### 9) PAN — experimental label
- **URL:** https://p-a-n.org/ redirects to https://home.p-a-n.org/
- **Reachability:** HTTP 200, title `Home | PAN`.
- **Direct observation:** Full-bleed dark video/film still (`MUBI PRESENTS` visible in screenshot), only four primary links: `Releases`, `Shop`, `Info`, `Subscribe`; one iframe detected.
- **Why relevant:** Highly reduced label home: strong image/motion mood + nearly no navigation.
- **Adapt without copying:** On mobile, after Sölbo’s locked intro, use only 3–4 action labels: Listen, Shows, Releases, Contact. Hide everything else below the fold.
- **Inference:** Sparse nav can feel more confident than a conventional artist menu when the hero image is strong.

### 10) Incienso — label / artist roster + shop
- **URL:** https://incienso.nyc/
- **Reachability:** HTTP 200, title `Incienso`.
- **Direct observation:** Pale grey/white label page with top nav `Info`, `Mixes`, `Merch`, `Shop`; long typographic roster (`DJ Python`, `Huerco S.`, `Beta Librae`, `Buttechno`, `Call Super`, etc.); 100+ images, seven videos, many sticky elements.
- **Why relevant:** Current underground house/ambient label site with roster-as-interface.
- **Adapt without copying:** Turn Sölbo’s collaborators/influences/shows into a horizontal/vertical name-field that can be filtered or tapped, rather than another card grid.
- **Inference:** Roster typography creates scene context quickly; for Sölbo it could situate the project inside a sonic community.

### 11) NTS — underground radio platform / live listening UI
- **URL:** https://www.nts.live/
- **Reachability:** HTTP 200, title `NTS | Don't Assume`.
- **Direct observation:** Dense live radio UI: nav `RADIO`, `LATEST`, `EXPLORE`, `INFINITE MIXTAPES`, `SHOP`, `NTS SUPPORTERS`, `MY NTS`; two live channels; `NOW` labels; genre tags; audio elements; 112 buttons and 211 links in the DOM; cookie modal in screenshot.
- **Why relevant:** Best reference for browse/listen behavior and persistent audio context.
- **Adapt without copying:** Add a small sticky “now playing / latest mix” rail or footer mini-player state, even if it simply links to SoundCloud/Spotify at first.
- **Inference:** Persistent audio context makes a music site feel alive; but the density should be reduced for Sölbo.

### 12) HÖR Berlin — underground DJ/live-set platform
- **URL:** https://hoer.live/
- **Reachability:** HTTP 200, title `hoer.live | Broadcasting DJ sets and Live acts 6 days a week`.
- **Direct observation:** Live/archival DJ-set page with `Maximum Heat`, `Library`, `Calendar`, `Shop`, `Members`; visible `Now Playing`; show cards with date, view counts, style tags, track ID/comments; very large archive (~2058 links, 320 images).
- **Why relevant:** Directly DJ-oriented, live-first, underground scene-facing.
- **Adapt without copying:** Sölbo shows list could include live-set metadata: date, city, view/listen link, tags, and one “track ID / notes” affordance.
- **Inference:** The “library/calendar/now playing” triad is more useful for DJs than generic bio/gallery pages.

### 13) Unsound 2026 — experimental festival
- **URL:** https://www.unsound.pl/en/unsound-2026
- **Reachability:** HTTP 200, title `Unsound.pl - Main Page`.
- **Direct observation:** 2026 edition page with marquee-like repeated `UNSOUND ADELAIDE 2026`; nav `ARTISTS`, `ARCHIVE`, `UNSOUND ADELAIDE 2026`, `UNSOUND LAB 2026`, `FAQ`, `EN/PL`; artist cards visible; news headline `Unsound 2026 Announces First Wave of Artists...`.
- **Why relevant:** Strong underground/experimental event brand using repetition, stark typography, and archive/program structure.
- **Adapt without copying:** Use repeated microtext/marquee for Sölbo show announcements, but keep it restrained and pause-able.
- **Inference:** Repetition can build club-poster energy without needing complex WebGL.

### 14) Rewire — adventurous music festival
- **URL:** https://www.rewirefestival.nl/ and line-up source https://www.rewirefestival.nl/festival/line-up
- **Reachability:** HTTP 200, title `Rewire | International festival for adventurous music` / `Rewire – The Hague, NL`.
- **Direct observation:** Homepage currently points to `Rewire 2027` while nav includes `LINE-UP 2026`; line-up screenshot uses a large soft-pink block, tiny logo, `MENU`, newsletter strip, and a deliberately sparse mid-page state.
- **Why relevant:** Good example of experimental-music festival brand that is not always image-heavy.
- **Adapt without copying:** Allow Sölbo sections to breathe: a quiet transition band with one sentence and newsletter/contact can be as memorable as another video panel.
- **Inference:** The pale empty field acts as a reset between dense festival pages; Sölbo can use this to break up black/grey visuals.

### 15) CTM Festival 2026 — adventurous music + art festival
- **URL:** https://www.ctm-festival.de/festival-2026/welcome
- **Reachability:** HTTP 200, title `Welcome | CTM Festival`.
- **Direct observation:** High-contrast white content with acid-lime header bar; visible `CTM 2026`, `27th Edition | 23 January – 1 February 2026`; large editorial intro; cookie controls at bottom.
- **Why relevant:** Experimental festival page that uses concept text and a memorable accent color instead of artist photos first.
- **Adapt without copying:** Give Sölbo’s one-page site a single conceptual line under the hero and use one electric accent color consistently for CTAs/states.
- **Inference:** Conceptual framing can make a DJ site feel art-directed rather than promotional.

### 16) MUTEK Montréal 2026 — electronic music + digital arts festival
- **URL:** https://mutek.org/
- **Reachability:** HTTP 200, title `MUTEK | MUTEK`.
- **Direct observation:** Purple/blue abstract 3D hero; nav for global cities; visible `MUTEK Montréal 2026`, `From August 25–30, 2026`, `Full Lineup and Program Revealed`, CTA `EXPLORE`; detected WebGL/video/Swiper/Next hints.
- **Why relevant:** Direct bridge between electronic music, immersive experience, and digital art.
- **Adapt without copying:** Sölbo’s mesh-gradient/footer-wave system could become a quieter “sonic material” hero layer with one clear Explore/Listen CTA.
- **Inference:** Abstract generative surfaces work best when anchored by concrete dates and program copy.

### 17) Dekmantel — label/festival/editorial platform
- **URL:** https://dekmantel.com/
- **Reachability:** HTTP 200, title `Home`.
- **Direct observation:** Multi-purpose site with `Home`, `Events`, `Records`, `Shop`, `Editorial`, `Rewind`; shopping cart visible; hero/editorial card `Improvisation as Time Travel — In Conversation with Speedy J`; mix-series and record-release sections.
- **Why relevant:** Techno/house ecosystem site balancing records, festivals, shop, and editorial.
- **Adapt without copying:** Add an editorial tile to Sölbo’s release/show grid: one interview, note, or field report can deepen the site beyond embeds.
- **Inference:** Editorial content is a credibility amplifier when artists have more to say than streaming links.

### 18) Draaimolen — forward-looking festival microsite
- **URL:** https://www.draaimolen.nu/
- **Reachability:** HTTP 200, title `Draaimolen`.
- **Direct observation:** Full-screen cinematic blue/green light scene with tiny centered question `What connects us?`/heading `What lies beyond the horizon?`; bottom progress/control bar; nav `Tickets`, `Merch`, `FAQ`; `NOW PLAYING: OUR FAVOURITE FULL CIRCLE SET`; one canvas, Three/Next/Sanity hints.
- **Why relevant:** The strongest direct reference for Sölbo’s scroll-scrub cinematic direction and immersive-but-simple nav.
- **Adapt without copying:** Keep Sölbo’s hero as a single immersive scene with a low-profile progress marker, then reveal practical content only after the first beat.
- **Inference:** The site succeeds because it commits to one atmospheric cinematic gesture, not many gimmicks.

### 19) Sónar 2026 — electronic/digital creativity festival
- **URL:** https://sonar.es/en
- **Reachability:** HTTP 200, title `Sónar - 18.19.20 June 2026`.
- **Direct observation:** Current page shows `Sónar 2026 Galleries`, `SonarMix`, `Sónar+D 2026`, partners, and an `Open Call` with deadline `07.09`; screenshot shows neon-green laser/crowd imagery with cookie modal.
- **Why relevant:** More mainstream than Sölbo, but transferable because Sónar+D connects music, digital creativity, galleries, and mixes.
- **Adapt without copying:** Add a “visuals / process” mini-section for Sölbo that pairs one live photo/video still with a short note about sound/visual design.
- **Inference:** The gallery/mix/process split is useful for a DJ who wants to be read as a digital artist, not only performer.

### 20) Spectral Field by Rob FWA — award-site benchmark / sound-reactive digital experience
- **URLs:** live: https://www.robfwa.com/ ; award/source: https://www.awwwards.com/sites/spectral-field
- **Reachability:** Live HTTP 200, title `Spectral Field · Rob FWA`; Awwwards page title `Spectral Field - Awwwards Nominee`.
- **Direct observation:** The page says `FFT 2048 · CLIENT-SIDE`, `Tap to play — 37 tracks, shuffled. Each draws its own artwork as it plays`, `USE YOUR OWN TRACK`, `Low Mid Hi`, `DOWNLOAD PNG`, `DOWNLOAD SVG`; one canvas and multiple transport buttons.
- **Award/source metadata:** Awwwards categorizes it under `Music & Sound`, `Animation`, `Data Visualization`, `Experimental`, `Responsive`, `Sound-Audio`, `Vanilla JS`, `Canvas API`.
- **Why relevant:** Exact technical overlap with Sölbo’s footer waves/audio-reactive ambitions, but as a compact client-side experience.
- **Adapt without copying:** Let one footer/hidden mode generate a visual from a Sölbo mix or preview, with download/share optional later. Start with non-audio-reactive seeded animation if performance is a concern.
- **Inference:** Sound-reactivity is most valuable when it creates an artifact or memory, not merely decorative bars.

### Award-winning studio note: Spotify Wrapped Party by Active Theory
- **URLs:** Awwwards source https://www.awwwards.com/sites/spotify-wrapped-party ; live https://wrapped-party.activetheory.dev/
- **Direct observation:** Awwwards page lists **`Site of the Day - Jul 24, 2026`** and credits **Active Theory**; tags include `Music & Sound`, `Animation`, `WebGL`, `Transitions`, `Data Visualization`, `Sound-Audio`, `GSAP`, `Firebase`. The live site returned HTTP 200 but redirected the headless browser to an unsupported/loading state, so I did **not** treat its interaction details as directly observed.
- **Relevance:** It is mainstream-brand work, not underground, but uniquely transferable as award-winning studio evidence for WebGL + audio/data + GSAP event experience.
- **Adapt without copying:** Borrow the system idea only: party/listening data can become an environmental scene. For Sölbo, keep it smaller: no login, no Firebase requirement, and no unsupported-browser dead end.

## Recurring patterns to consider for Sölbo

1. **One strong cinematic first gesture beats many widgets.** Floating Points, PAN, Draaimolen, MUTEK each commit to one high-impact image/scene before utility.
2. **Micro-nav is usually better than full menus.** The strongest sites use 3–6 labels: Listen/Watch/Store/Tour/Info, or equivalent.
3. **Archive depth builds underground credibility.** Jaar, Ryoji Ikeda, Ilian Tape, Hessle, NTS, HÖR all reward browsing through chronology, catalogs, mixes, and recordings.
4. **Typographic repetition is a common motion substitute.** Caterina Barbieri, Unsound, Incienso, and Serhat Durmus use repeated titles/names/marquees to create rhythm without needing video everywhere.
5. **Audio context matters.** NTS/HÖR make the site feel alive through now-playing states; Spectral Field turns audio into a visual artifact; Sölbo can use a lighter persistent latest-mix state.
6. **Editorial framing differentiates artists.** Max Cooper, CTM, Dekmantel, and MUTEK use concept copy/editorial modules to signal a point of view.
7. **Concrete dates anchor abstraction.** MUTEK/CTM/Sónar/Unsound pair abstract visual systems with exact event dates, preventing the art direction from feeling vague.
8. **Simple external platform links remain important.** Ilian Tape/Hessle/Max Cooper expose Bandcamp/SoundCloud/Spotify/Hard Wax/Juno/etc. rather than hiding all listening inside embeds.
9. **Canvas/WebGL appears selectively, not everywhere.** Draaimolen, MUTEK, Spectral Field, Aorum/Active Theory benchmark richer rendering, but many respected sites are plain HTML/CSS and still strong.
10. **White-space/minimalism is still underground-coded.** Jaar/Ryoji/Hessle/PAN prove that not every electronic site needs black neon.

## Anti-patterns observed

1. **Cookie modals blocking the hero.** NTS, HÖR, CTM, Sónar, Floating Points screenshots were partially obscured. Sölbo should avoid intrusive consent UX where possible.
2. **Unsupported-browser dead ends.** Spotify Wrapped Party’s live site was not inspectable in headless and showed an unsupported/loading path. Sölbo should provide graceful fallback for no-WebGL/reduced-motion/mobile.
3. **Overdense archive UIs on mobile risk overwhelm.** NTS/HÖR are powerful but far too dense for Sölbo’s one-page mood unless reduced to a curated subset.
4. **Too many external embeds can fragment performance and aesthetics.** Spotify/SoundCloud/Bandcamp/YouTube are expected, but embed grids should lazy-load and have static fallbacks in Astro.
5. **Concept copy without immediate action can stall conversion.** CTM/Rewire-style editorial whitespace is useful, but Sölbo needs Listen/Shows actions visible after the intro.
6. **Generic storefronts dilute artist aura.** Arca works because the product design is stark and release-specific; a generic merch block would feel less premium.
7. **High-motion marquees can become noise.** Unsound/Incienso/Caterina patterns are adaptable only if speed, contrast, and reduced-motion fallbacks are controlled.

## Practical recommendations for the Sölbo Astro/GSAP/Lenis migration

- Keep the **193-frame portrait hero** as the signature, but pair it with a simple micro-nav and one CTA state, not a full menu overlay.
- Add a **static no-JS/low-motion path**: hero poster frame, release cards, show list, footer contact. This avoids the Active Theory unsupported-browser problem.
- Rework music cards into **chapter cards**: title, one-line mood, cover/visual, listen links, optional embed lazy-loaded on tap.
- Add one **archive/editorial row**: “latest mix / field note / studio note” to borrow Max Cooper + Dekmantel credibility without copying their layouts.
- Use **track-title typography as motion texture** during transitions/footer instead of adding more 3D.
- Treat **footer waves** like Spectral Field-lite: seeded audio-inspired motion, with reduced-motion pause and no required audio permission.
- Keep platform embeds behind **progressive disclosure** for performance on Cloudflare/Astro.

## Rejected / caution examples checked

- `https://ra.co` / `https://ra.co/events/`: reachable only as Cloudflare/DataDome 403 from this environment, so not used.
- `https://hollyherndon.com/`: timed out in both browser and curl from this environment, so not used.
- `https://ad93.com/`: redirects to a domain-for-sale page, so not used.
- `https://objekt.net/` and `https://eartheater.com/`: returned access-denied/domain-sale style pages in this environment, so not used.
- `https://www.sherelle.earth/`, `https://www.inciensonyc.com/`, `https://www.jlinmusic.com/`, `https://ayacunt.com/`: DNS failures from this environment; not used.
