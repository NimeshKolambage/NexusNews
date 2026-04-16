import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', 
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    allowedHosts: ['nexus-news.live'], 
    port: 4173,
    host: "0.0.0.0", 
    strictPort: true
  }
})