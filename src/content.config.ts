import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";

import { linkSchema, releaseSchema, showSchema, siteSchema } from "./content/schemas";

const shows = defineCollection({
  loader: glob({ base: "./src/content/shows", pattern: "**/*.json" }),
  schema: showSchema,
});

const releases = defineCollection({
  loader: glob({ base: "./src/content/releases", pattern: "**/*.json" }),
  schema: releaseSchema,
});

const links = defineCollection({
  loader: glob({ base: "./src/content/links", pattern: "**/*.json" }),
  schema: linkSchema,
});

const site = defineCollection({
  loader: glob({ base: "./src/content/site", pattern: "site.json" }),
  schema: siteSchema,
});

export const collections = { shows, releases, links, site };
