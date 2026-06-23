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
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        emerald: {
          DEFAULT: 'var(--brand-primary)',
          50: 'rgba(0, 212, 168, 0.1)',
          100: 'rgba(0, 212, 168, 0.2)',
          200: 'rgba(0, 212, 168, 0.3)',
          300: 'rgba(0, 212, 168, 0.5)',
          400: 'var(--brand-primary)',
          500: 'var(--brand-primary)',
          600: 'var(--brand-primary)',
          700: 'var(--brand-primary)',
          800: 'var(--brand-primary)',
          900: 'var(--brand-primary)',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
