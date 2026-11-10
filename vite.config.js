import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this repository under /messenger/.
export default defineConfig({
  plugins: [react()],
  base: '/messenger/',
});
