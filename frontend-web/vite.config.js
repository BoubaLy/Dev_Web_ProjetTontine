import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split vendor : React + framer-motion + data sortent du chunk d'entrée
        // monolithique → téléchargements parallèles (HTTP/2) + meilleur cache entre
        // visites. GSAP reste dans HowItWorksStory (déjà lazy, après le hero).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('framer-motion') || id.includes('/motion-dom/') || id.includes('/motion-utils/')) return 'motion';
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/') || id.includes('/scheduler/')) return 'react';
          if (id.includes('@tanstack') || id.includes('axios')) return 'data';
          return undefined;
        },
      },
    },
  },
})
