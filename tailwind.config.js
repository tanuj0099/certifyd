// ─────────────────────────────────────────────────────────
// Tailwind needs to know which files to scan for class names.
// If content is wrong/missing, Tailwind purges everything in prod.
// ─────────────────────────────────────────────────────────
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
