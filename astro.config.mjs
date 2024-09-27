import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";

import svelte from "@astrojs/svelte";
import ViteYaml from '@modyfi/vite-plugin-yaml';
import yaml from '@rollup/plugin-yaml';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), mdx(), svelte()],
  site: 'https://wstofedn.com',
  vite: {
    plugins: [yaml()]
  }
});