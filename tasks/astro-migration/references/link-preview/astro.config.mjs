import { defineConfig, sessionDrivers } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  trailingSlash: 'never',
  adapter: cloudflare({
    imageService: 'passthrough',
    prerenderEnvironment: 'workerd',
  }),
  session: {
    driver: sessionDrivers.lruCache(),
  },
});
