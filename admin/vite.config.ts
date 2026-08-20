import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const API = process.env.API_URL ?? 'http://localhost:4000'

export default defineConfig({
  // Собранная админка раздаётся сервером по адресу /admin
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(process.cwd(), 'src') } },
  build: { outDir: path.resolve(process.cwd(), '..', 'server', 'public', 'admin'), emptyOutDir: true },
  server: {
    port: 5181,
    // В разработке ходим на API через прокси — тогда куки те же, и CORS не мешает
    proxy: {
      '/api': { target: API, changeOrigin: true },
      '/uploads': { target: API, changeOrigin: true },
    },
  },
})
