import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  optimizeDeps: {
    exclude: ['@icr/polyseg-wasm']
  },
  worker: {
    plugins: () => [
      wasm(),
      topLevelAwait()
    ],
    rollupOptions: {
      external: (id) => id === 'a' || id.includes('polyseg-wasm')
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: (id) => id === 'a' || id.includes('polyseg-wasm')
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});