/** @type {import('tailwindcss').Config} */
module.exports = {
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
        // Using CSS variables from the existing theme
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
