# Sölbo Website — Client Guide

This is a plain-language guide to managing your website's content. No coding required — everything below is done through two web dashboards: **Vercel** (hosting) and **Supabase** (your shows/releases database).

---

## 1. Credentials You Need to Provide

Before the site can go fully live with your own data, you (or whoever manages accounts for you) need to provide:

| Item | What it's for |
|------|----------------|
| An email address for your Vercel account | Hosting account ownership |
| An email address for your Supabase account | Database account ownership |
| Your final domain name (e.g. `solbo.com`) | Connecting the custom domain |
| Access to your domain's DNS settings (registrar login, or ability to add DNS records) | Pointing your domain at the site |
| Real Spotify track/release URLs | Replacing placeholder music players |
| Real SoundCloud track URLs | Replacing placeholder music players |
| Any updated booking, social, or ticket links | Keeping contact/social info accurate |

Nothing above needs to be figured out by you technically — you just need to supply the accounts/links, and the developer wires them up.

---

## 2. How to Log In

- **Vercel** (hosting): go to [vercel.com](https://vercel.com), log in with the account email set up for you.
- **Supabase** (database): go to [supabase.com](https://supabase.com), log in with the account email set up for you, then open the Sölbo project.

You do not need to log in to anything to just *view* the live website — it's public. Logging in is only needed when you want to *change* content.

---

## 3. Editing Shows

1. Log in to Supabase → open the project.
2. In the left sidebar, click **Table Editor**.
3. Select the **shows** table.
4. To add a show: click **Insert row** and fill in date, venue, city, country, and ticket link.
5. To edit a show: click into any cell and type the new value.
6. To mark a show **sold out**: set `is_sold_out` to `true`.
7. To mark a show **free**: set `is_free` to `true`.
8. To add a ticket link: edit the `ticket_url` cell.

Changes save automatically and appear on the live site after a page reload (see "Previewing Changes" below).

---

## 4. Editing Releases

1. In Supabase Table Editor, select the **releases** table.
2. To add a release: click **Insert row** and fill in title, release date, and type (`single`, `ep`, or `album`).
3. To edit a release: click into any cell and type the new value.

---

## 5. Uploading Artwork

1. In Supabase, go to **Storage** in the left sidebar.
2. Open the **release-artwork** bucket.
3. Click **Upload file** and choose your image.
4. After upload, click the file to copy its **public URL**.
5. Go back to **Table Editor → releases**, find the row for that release, and paste the URL into the `artwork_url` column.

---

## 6. Adding Spotify and SoundCloud Links

In **Table Editor → releases**, each release row has:

- `spotify_url` — paste the public Spotify track/release link here (e.g. `https://open.spotify.com/track/...`)
- `soundcloud_url` — paste the public SoundCloud track link here (e.g. `https://soundcloud.com/artist/track-name`)

The site automatically turns these into playable embeds — no extra formatting needed. Leave a field blank if that platform isn't available for a release.

---

## 7. Where Social, Booking, and Placeholder Links Live

These links currently live in the site's code (`data/mock.ts`) rather than Supabase, since they change less often:

| Link | Current value |
|------|----------------|
| Instagram | `https://www.instagram.com/solbo__/?hl=en` |
| TikTok | `https://www.tiktok.com/@solbo__` |
| Facebook | `https://www.facebook.com/solbo.music` |
| Booking email | `booking@solbo.studio` (placeholder — confirm before launch) |
| Spotify (header/footer link, separate from release embeds) | placeholder — needs your real Spotify profile URL |
| SoundCloud (header/footer link) | placeholder — needs your real SoundCloud profile URL |

Send the developer any updates to these and they'll update the code directly (this does not require a database change).

---

## 8. How to Preview Changes

- The live production site reflects whatever is in Supabase and the deployed code.
- After editing a show or release in Supabase, reload the live site — changes to shows/releases appear right away since they're fetched fresh.
- If you're unsure whether a change "took," open the site in an incognito/private browser window to rule out cached content.
- For code changes (new features, design tweaks), the developer will share a preview link before anything goes live.

---

## 9. What to Check Before Publishing

Before telling people the site is "done" or sharing it widely, confirm:

- [ ] All shows listed are current (past shows removed or clearly dated)
- [ ] Ticket links work and go to the correct page
- [ ] Sold-out and free shows are correctly marked
- [ ] All releases have artwork uploaded
- [ ] Spotify and SoundCloud links play the correct track
- [ ] Social links go to the right profiles
- [ ] Booking email is correct
- [ ] Site loads correctly on both phone and desktop

---

## 10. Who to Contact for Issues

Contact your developer for anything involving:

- The site domain not loading, or showing a security warning
- Environment variables / account credentials
- A failed deployment or build error
- Missing or incorrect Supabase/Vercel access
- DNS or domain transfer issues

Day-to-day content changes (shows, releases, artwork, music links) are all safe to do yourself using the steps above — you don't need a developer for those.
