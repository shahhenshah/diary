import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Makes asset paths relative so Electron can load them from the file system.
  server: {
    port: 5173,
    strictPort: true
  }
});
