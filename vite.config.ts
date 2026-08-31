import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative assets work on GitHub Pages, even when the repository name changes.
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        articles: 'articles/index.html',
        tenByTenBedroomLayout: 'articles/10x10-bedroom-layout/index.html',
        smallBedroomDeskDresser: 'articles/small-bedroom-desk-dresser/index.html',
        bedroomLayoutClearanceGuide: 'articles/bedroom-layout-clearance-guide/index.html',
        bedsideStorageUnderTwelve: 'articles/bedside-storage-under-12-inches/index.html',
      },
    },
  },
})
