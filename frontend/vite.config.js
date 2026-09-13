import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/admin-session': {
        target: 'http://localhost:3001',
        changeOrigin: false
      },
      '/api/track': {
        target: 'http://localhost:3001',
        changeOrigin: false
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
