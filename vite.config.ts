import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

    const socketTarget = mode === 'development'
        ? 'http://localhost:3000'
        : 'http://signaling-server:3000';

    const apiTarget = mode === 'development'
        ? 'http://localhost:3001'
        : 'http://signaling-server:3001';

    return {
      plugins: [react()],
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
          '@components': resolve(__dirname, 'src/components'),
          '@hooks': resolve(__dirname, 'src/hooks'),
          '@utils': resolve(__dirname, 'src/utils'),
          '@stores': resolve(__dirname, 'src/stores'),
          '@services': resolve(__dirname, 'src/services'),
        },
      },
      server: {
        port: 4000,
        host: true,
        proxy: {
          '/socket.io': {
            target: socketTarget,
            ws: true,
            changeOrigin: true,
          },
          '/api': {
            target: apiTarget,
            changeOrigin: true,
          },
        }
      },
      build: {
        outDir: 'dist',
        sourcemap: true,
      }
    }
})
