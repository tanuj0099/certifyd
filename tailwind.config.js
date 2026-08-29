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
        display: ['var(--font-inter-tight)', 'sans-serif'],
      },
      colors: {
        emerald: {
          DEFAULT: 'var(--brand-primary)',
          50: 'rgba(249, 115, 22, 0.1)',
          100: 'rgba(249, 115, 22, 0.2)',
          200: 'rgba(249, 115, 22, 0.3)',
          300: 'rgba(249, 115, 22, 0.5)',
          400: 'var(--brand-primary)',
          500: 'var(--brand-primary)',
          600: 'var(--brand-primary)',
          700: 'var(--brand-primary)',
          800: 'var(--brand-primary)',
          900: 'var(--brand-primary)',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#374151',
          700: '#1F2937',
          800: '#111827',
          900: '#0F172A',
          950: '#0B0F19',
        },
        brand: {
          primary: '#F97316',
          gradient: '#818CF8',
        },
        semantic: {
          positive: '#5B8C72',
          negative: '#B5533B',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
