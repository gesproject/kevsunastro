# Task 5.2 - Initial CMS demo content

## Decision and scope

On 2026-08-22, the human chose to keep the former Vercel placeholder catalog
and explicitly approved its migration as CMS demo content. This is a visual
and editorial-workflow fixture, not a claim that the listings are current.

The imported records preserve the legacy labels, dates, types, and
already-versioned artwork. Release priority follows the former API's
release-date-descending order (Mecca, Threshold, Periphery). Unverified ticket
and streaming URLs are omitted.
`demo` is a visible show state, so no placeholder destination becomes a live
link.

## Content now managed in Keystatic

| Collection | Records | Order | Destination behavior |
| --- | ---: | --- | --- |
| Shows | 5 | VELD, Stereo, New City Gas, Newspeak, Yoko Luna | First two show `Demo`; sold-out/free flags retain their legacy state; no ticket links. |
| Releases | 3 | Mecca, Threshold, Periphery | Existing `/images/` cover files render in the release grid; no Spotify, SoundCloud, Bandcamp, or YouTube URLs. |
| Links | 7 | Existing priorities retained | Booking plus Instagram, TikTok, and Facebook stay unchanged; Listen and Buy remain visibly pending. |
| Site | 1 | Singleton | Existing artist copy, location, profile image, and booking address remain unchanged. |

The release image field now writes to `public/images/`, matching the three
versioned legacy covers. This reuses the source files rather than duplicating
large binary artwork into a second directory.

## Rendered behavior

- `/` has five CMS-sourced Show rows and three release cards.
- The preserved static Spotify/SoundCloud player cards remain the
  no-JavaScript floor: no third-party iframe is emitted without an approved
  streaming URL.
- `/link` shows Mecca as the first priority release and VELD as a `Demo
  listing`; it does not emit a ticket link.
- The `demo` state is also an available Keystatic status (`Demo / TBA`) for
  future non-live listings.

## Verification

| Check | Result |
| --- | --- |
| `npm run check` | Pass: Astro 0 errors, 0 warnings, 0 hints; 4 unit checks pass. |
| `npm run build` | Pass: Astro Cloudflare server build completes. The existing Keystatic editor chunk-size warning remains isolated from public routes. |
| Content browser check | Pass: `e2e/task-5.2-demo-content.spec.ts` verifies counts, priority order, flags, artwork, absent embeds/tickets, booking, social destinations, and pending actions with JavaScript disabled. |
| Focused regression | Pass: Music, Shows, and Task 5.2 suites pass 10/10 serially against the built Cloudflare Worker. |

No Cloudflare, DNS, Vercel, Supabase, GitHub ownership, or external-link
mutation occurred.

## Publication boundary

Before the production content cutover, replace each demo listing with the
approved real record and add only verified official ticket/streaming links.
The demo catalog is intentionally safe to render but is not final editorial
content.
