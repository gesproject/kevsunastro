import { defineConfig, sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
    prerenderEnvironment: 'workerd',
  }),
  integrations: [react(), keystatic()],
  session: {
    driver: sessionDrivers.lruCache(),
  },
});
