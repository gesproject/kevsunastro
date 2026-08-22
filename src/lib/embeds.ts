/**
 * Build-time embed-URL allowlist.
 *
 * Editors supply these URLs through the CMS, so an unchecked value would land
 * straight in an iframe `src`. Only https URLs on the exact provider hosts are
 * turned into embeds; anything else returns null and the caller renders its
 * in-page fallback player instead.
 */

const SPOTIFY_EMBEDDABLE = new Set(["track", "album", "playlist", "artist", "episode", "show"]);

function parseHttps(url: string | undefined) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

export function spotifyEmbedUrl(url: string | undefined) {
  const parsed = parseHttps(url);
  if (!parsed || parsed.hostname !== "open.spotify.com") return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  // Spotify's own share button prefixes a locale for non-English clients.
  if (segments[0]?.startsWith("intl-")) segments.shift();

  const [type, id] = segments;
  // IDs are 22-character base62. A looser pattern accepts literal "placeholder"
  // and builds an embed that renders as a broken player instead of the fallback.
  if (!type || !SPOTIFY_EMBEDDABLE.has(type) || !/^[A-Za-z0-9]{22}$/.test(id ?? "")) return null;

  return `https://open.spotify.com/embed/${type}/${id}`;
}

export function soundcloudEmbedUrl(url: string | undefined) {
  const parsed = parseHttps(url);
  if (!parsed) return null;

  // Suffix matching alone would accept `notsoundcloud.com`.
  const host = parsed.hostname;
  if (host !== "soundcloud.com" && !host.endsWith(".soundcloud.com")) return null;
  if (parsed.pathname === "/") return null;

  // Rebuild from origin + path only. The widget resolver handles canonical
  // track URLs, so passing `w.soundcloud.com` through nests the player inside
  // itself, and `parsed.toString()` would forward any userinfo, query, and
  // hash to the third party.
  const track = `https://soundcloud.com${parsed.pathname}`;

  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(track)}&auto_play=false`;
}
