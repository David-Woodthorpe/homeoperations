import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ out: 'build' }),
    paths: {
      // Relative asset URLs keep the app working under Home Assistant ingress
      // and under a normal localhost install.
      relative: true
    }
  }
};

export default config;
