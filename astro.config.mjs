// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://grubby-galaxy.netlify.app',
  integrations: [
    tailwind({
      config: {
        content: [
          "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
        ],
        theme: {
          extend: {
            fontFamily: {
              sans: ['DM Sans', 'system-ui', 'sans-serif'],
              serif: ['Baskervville', 'Georgia', 'serif'],
            },
            colors: {
              'text': 'var(--color-text)',
              'border': 'var(--color-border)',
              'accent': 'var(--color-accent)',
              'bg': 'var(--color-bg)',
              'bg-secondary': 'var(--color-bg-secondary)',
              'muted': 'var(--color-muted)',
            },
          },
        },
        plugins: [],
      }
    })
  ],
});
