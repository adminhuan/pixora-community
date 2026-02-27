import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/admin/' : '/',
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 3301,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          if (id.includes('/react/') || id.includes('react-dom')) {
            return 'react-vendor';
          }

          if (id.includes('react-router')) {
            return 'router-vendor';
          }

          if (id.includes('recharts')) {
            return 'chart-vendor';
          }

          if (id.includes('react-markdown') || id.includes('remark-') || id.includes('rehype-')) {
            return 'markdown-vendor';
          }

          return undefined;
        },
      },
    },
  },
}));
