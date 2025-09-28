import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { inlineAssetsPlugin } from './vite-plugin-inline-assets.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), inlineAssetsPlugin()],
  resolve: {
    alias: {
      '@zxing/library': '@zxing/library/esm/index.js'
    }
  },
  optimizeDeps: {
    include: ['@zxing/library', '@zxing/browser']
  },
  server: {
    https: {
      key: fs.readFileSync('./cert.key'),
      cert: fs.readFileSync('./cert.crt'),
    },
    host: '0.0.0.0', // Allow connections from any IP
    port: 3000,
    hmr: false, // Disable HMR for network access
    strictPort: true,
    cors: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable chunking for better offline support
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js'
      },
      external: [],
      onwarn(warning, warn) {
        // Suppress warnings about @zxing/library
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('@zxing')) {
          return;
        }
        warn(warning);
      }
    }
  },
  publicDir: 'public',
  base: './'
})