# Editing the site in Keystatic — a short guide for non-developers

You edit this website's content in a private admin area at **`/keystatic`**
(for example `https://your-site-domain/keystatic`). Nothing you do there can
break the design — you only change words, dates, images and links.

## Signing in

1. Open `/keystatic` in your browser.
2. Click **Sign in with GitHub** and approve the access prompt.
3. You land on the dashboard. Every change is saved as a draft on a
   `keystatic/` branch first — the live site updates only after changes are
   merged to `main`.

## What you can edit

| Collection | What it is | What to fill in |
|---|---|---|
| **Shows** | Upcoming live dates shown in the "Find me live" list | Date, venue, city, country, status (`available`, `sold-out`, `free`, or `demo`), optional ticket URL |
| **Releases** | Records shown in the Releases grid | Title, release date, type (single/EP/album), artwork image |
| **Links** | The social/listen buttons | Label, destination URL, enabled on/off |
| **Site Settings** | Artist name, tagline, booking email | Plain text fields |

## Everyday recipes

**Add a show:** Shows → *Create new* → fill date/venue/city → set status →
Save. Leave ticket URL empty until tickets go on sale.

**Mark a show sold out:** open the show → change status to `sold-out` → Save.
The row automatically switches from a Tickets link to a Sold Out badge.

**Publish a real streaming link once available:** Links → open *Listen* /
*Buy* → paste the real URL → set enabled ON → Save.
(While pending, they display as inactive labels.)

**Replace demo content:** delete or edit any record marked `demo`. Real
records always take precedence over placeholders.

## Saving, reviewing, undoing

- **Save** writes a draft. Nothing is public yet.
- Changes appear as commits on the `keystatic/` branch — someone with repo
  access merges them to publish.
- To undo an edit, restore the previous version of that file in GitHub
  (Keystatic keeps every save), or ask us — every change is recoverable.

## Rules of thumb

1. Never paste passwords or secrets into any field.
2. Images: use JPG/WebP under ~500 KB; Keystatic stores them in the repo's
   versioned media folder automatically.
3. Dates are ISO (YYYY-MM-DD) in the form but display formatted on the site.
4. If something looks broken after saving, it will never be permanent —
   drafts are isolated from the live site until merged.

## When in doubt

Screenshot what you see and send it over. Content mistakes are cheap to fix;
there is no way to accidentally delete the site itself from Keystatic.
