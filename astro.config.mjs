import { defineConfig, sessionDrivers } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

const cloudflareBuild = process.argv.includes("build");

export default defineConfig({
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
  integrations: [react()],
  session: {
    driver: sessionDrivers.lruCache(),
  },
});
