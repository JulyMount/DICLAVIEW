import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  // Trata ficheiros .wasm como assets estáticos em vez de módulos JS
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    exclude: ['@icr/polyseg-wasm']
  },
  worker: {
    plugins: () => [
      wasm(),
      topLevelAwait()
    ]
  },
  build: {
    target: 'esnext'
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});