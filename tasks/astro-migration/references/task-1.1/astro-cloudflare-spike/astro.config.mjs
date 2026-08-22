import { defineConfig, sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
    prerenderEnvironment: 'workerd',
  }),
  integrations: [react()],
  session: {
    driver: sessionDrivers.lruCache(),
  },
});
