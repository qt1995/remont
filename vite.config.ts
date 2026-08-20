import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// На GitHub Pages сайт лежит в подпапке репозитория, поэтому нужен базовый путь.
// Локальная разработка и обычная сборка остаются на "/".
const PAGES_BASE = '/penis.github.io/'

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? PAGES_BASE : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  server: { port: 5180 },
}))
