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
        eightByTenBedroomFullBedDesk: 'articles/8x10-bedroom-full-bed-desk/index.html',
        desksUnderThirtySix: 'articles/desks-under-36-inches/index.html',
        narrowDressersUnderTwentyFour: 'articles/narrow-dressers-under-24-inches/index.html',
        storageBedDrawersVsLiftUp: 'articles/storage-bed-drawers-vs-lift-up/index.html',
        dormRoomShoppingPlanUnderThreeHundred: 'articles/dorm-room-shopping-plan-under-300/index.html',
        nineByTenBedroomQueenBed: 'articles/9x10-bedroom-queen-bed/index.html',
      },
    },
  },
})
