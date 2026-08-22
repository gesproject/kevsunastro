import { defineConfig, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const cloudflareBuild = process.argv.includes("build");

// Canonical origin for sitemap/canonical/OG URLs. Overridable so the Phase 7
// domain cutover is a one-line change (or an env var in CI) with no code edits.
const SITE_URL = process.env.SITE_URL ?? "https://solbo-astro7-cloudflare.nickgagne92.workers.dev";

export default defineConfig({
  site: SITE_URL,
  output: cloudflareBuild ? "server" : "static",
  // Astro's local dev server does not need a workerd runtime. Keeping the
  // Cloudflare adapter to build/preview avoids loading its Worker runner
  // during local authoring while the generated Worker remains the deployable
  // artifact verified by the Cloudflare commands.
  adapter:
    !cloudflareBuild
      ? undefined
      : cloudflare({
          imageService: "passthrough",
          prerenderEnvironment: "workerd",
        }),
  integrations: [react(), sitemap()],
  session: {
    driver: sessionDrivers.lruCache(),
  },
});
