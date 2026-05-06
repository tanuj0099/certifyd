import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// ─────────────────────────────────────────────────────────
// NUCLEAR RULE: NO CSP headers in dev.
// CSP is a PRODUCTION concern — handled entirely by vercel.json.
// Setting it here was the root cause of the `eval` block.
// Vite's HMR, esbuild, and React Fast Refresh all need eval() in dev.
// ─────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // This tells Vite that anytime it sees "@/" to look inside the "src/" folder
      "@": path.resolve(__dirname, "./src"),
    },
  },
})