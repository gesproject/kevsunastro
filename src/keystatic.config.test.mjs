import assert from "node:assert/strict";
import test from "node:test";

import { createReader } from "@keystatic/core/reader";
import keystatic from "../keystatic.config.mjs";

test("Keystatic manages the existing JSON content contract in GitHub mode", async () => {
  assert.deepEqual(keystatic.storage, {
    kind: "github",
    repo: "gesproject/kevsunastro",
    branchPrefix: "keystatic/",
  });
  assert.deepEqual(Object.keys(keystatic.collections), ["shows", "releases", "links"]);
  assert.equal(keystatic.collections.shows.path, "src/content/shows/*");
  assert.equal(keystatic.collections.releases.path, "src/content/releases/*");
  assert.equal(keystatic.collections.links.path, "src/content/links/*");
  assert.equal(keystatic.singletons.site.path, "src/content/site/site.json");
  assert.equal(keystatic.singletons.site.format, "json");

  const reader = createReader(process.cwd(), keystatic);
  assert.equal((await reader.collections.shows.list()).length, 5);
  assert.equal((await reader.collections.releases.list()).length, 3);
  assert.equal((await reader.collections.links.list()).length, 7);
  assert.equal((await reader.collections.shows.read("veld"))?.status, "demo");
  assert.equal((await reader.collections.releases.read("mecca"))?.artwork, "/images/artwork-mecca.webp");
  assert.equal((await reader.collections.links.read("booking"))?.href, "mailto:booking@solbo.studio");

  assert.throws(() => keystatic.collections.shows.schema.date.validate("2026-02-30"), /real calendar date/);
  assert.throws(() => keystatic.collections.shows.schema.city.validate("   "), /City cannot be blank/);
  assert.throws(() => keystatic.collections.shows.schema.ticketUrl.validate("http://tickets.example"), /HTTPS/);
  assert.throws(() => keystatic.collections.releases.schema.priority.validate(null), /Display priority is required/);
  assert.throws(() => keystatic.collections.links.schema.href.validate("ftp://example.com"), /HTTPS URL, a mailto/);
  assert.doesNotThrow(() => keystatic.collections.links.schema.href.validate("mailto:booking@solbo.studio"));
  assert.throws(() => keystatic.singletons.site.schema.artistName.validate("   "), /Artist name cannot be blank/);
  assert.throws(() => keystatic.singletons.site.schema.bookingEmail.validate("not-an-email"), /valid email/);
});
