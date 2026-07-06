import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Honor a PORT assigned by the tooling/harness so the dev server binds where it's
    // expected instead of auto-incrementing to the next free port when 5173 is taken.
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
  },
})
