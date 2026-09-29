import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [
    wasm()
  ],
  optimizeDeps: {
    exclude: ['@icr/polyseg-wasm', '@cornerstonejs/dicom-image-loader']
  },
  worker: {
    format: 'es',
    plugins: () => [
      wasm()
    ],
    rollupOptions: {
      external: ['@icr/polyseg-wasm', 'a']
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['@icr/polyseg-wasm', 'a']
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});