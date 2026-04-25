import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const backendUrl = (process.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000/public').replace(/\/$/, '');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/uploads': {
        target: backendUrl,
        changeOrigin: true,
      }
    }
  }
});