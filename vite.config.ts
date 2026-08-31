import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  // Relative assets work on GitHub Pages, even when the repository name changes.
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        articles: resolve(__dirname, 'articles/index.html'),
        tenByTenBedroomLayout: resolve(__dirname, 'articles/10x10-bedroom-layout/index.html'),
      },
    },
  },
})
