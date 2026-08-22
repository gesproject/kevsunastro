// npm test  (needs --experimental-strip-types on the pinned Node 22.12.0)
import assert from "node:assert/strict";
import test from "node:test";

import { linkSchema } from "../content/schemas.ts";
import { soundcloudEmbedUrl, spotifyEmbedUrl } from "./embeds.ts";

test("spotify: embeds only https open.spotify.com resource URLs", () => {
  assert.equal(
    spotifyEmbedUrl("https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"),
    "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT",
  );
  assert.equal(spotifyEmbedUrl(undefined), null);
  assert.equal(spotifyEmbedUrl("not a url"), null);
  assert.equal(spotifyEmbedUrl("javascript:alert(1)"), null);
  assert.equal(spotifyEmbedUrl("http://open.spotify.com/track/abc"), null, "http is rejected");
  assert.equal(spotifyEmbedUrl("https://open.spotify.com.evil.test/track/abc"), null, "lookalike host");
  assert.equal(spotifyEmbedUrl("https://open.spotify.com/track"), null, "missing id");
  assert.equal(spotifyEmbedUrl("https://open.spotify.com/legal/terms"), null, "not an embeddable type");
  assert.equal(spotifyEmbedUrl("https://open.spotify.com/track/placeholder"), null, "not a 22-char id");
  assert.equal(
    spotifyEmbedUrl("https://open.spotify.com/intl-de/track/4cOdK2wGLETKBW3PvgPWqT"),
    "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT",
    "locale prefix from Spotify's own share button",
  );
});

test("soundcloud: accepts the apex and its subdomains, not lookalikes", () => {
  assert.equal(
    soundcloudEmbedUrl("https://soundcloud.com/solbo/mecca"),
    "https://w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com%2Fsolbo%2Fmecca&auto_play=false",
  );
  assert.equal(soundcloudEmbedUrl("https://notsoundcloud.com/solbo/mecca"), null);
  assert.equal(soundcloudEmbedUrl("https://soundcloud.com/"), null, "no track path");
  assert.equal(soundcloudEmbedUrl("javascript:alert(1)"), null);

  // Subdomains normalize to the canonical host, and nothing else rides along:
  // `w.soundcloud.com` would otherwise nest the player inside itself, and
  // userinfo/query/hash would be forwarded to the third-party widget.
  const canonical = soundcloudEmbedUrl("https://soundcloud.com/solbo/mecca");
  assert.equal(soundcloudEmbedUrl("https://m.soundcloud.com/solbo/mecca"), canonical);
  assert.equal(soundcloudEmbedUrl("https://w.soundcloud.com/solbo/mecca"), canonical);
  assert.equal(soundcloudEmbedUrl("https://user:pw@soundcloud.com/solbo/mecca?x=1#y"), canonical);
});

test("link schema: href scheme is allowlisted, not just URL-shaped", () => {
  const link = (href) => linkSchema.safeParse({ label: "X", kind: "social", priority: 1, enabled: true, href });

  // z.url() alone accepts these, and they execute in-origin from an href.
  assert.equal(link("javascript:alert(1)").success, false);
  assert.equal(link("data:text/html,<script>alert(1)</script>").success, false);
  assert.equal(link("vbscript:msgbox(1)").success, false);
  assert.equal(link("http://solbo.test/insecure").success, false, "https only");

  assert.equal(link("https://www.instagram.com/solbo__/").success, true);
  assert.equal(link("mailto:booking@solbo.studio").success, true);
  assert.equal(
    linkSchema.safeParse({ label: "View site", kind: "site", priority: 1, enabled: true, href: "/" }).success,
    true,
  );
});
