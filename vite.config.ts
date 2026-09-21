import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  base: '/',
  build: {
    rollupOptions: {
      // Druga i trzecia podstrona (kalkulator wynagrodzeń, kalkulator
      // zdolności kredytowej) jako osobne entry pointy — ta sama domena/
      // hosting (GitHub Pages statycznie uploaduje cały dist/), ale
      // zupełnie inny React root i inny stan każda, bez routera.
      input: {
        main: resolve(__dirname, 'index.html'),
        wynagrodzenia: resolve(__dirname, 'wynagrodzenia.html'),
        creditworthiness: resolve(__dirname, 'zdolnosc-kredytowa.html'),
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          chart: ['chart.js'],
        },
      },
    },
  },
})
