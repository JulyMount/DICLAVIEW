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
    ]
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      // Impede que o analisador CommonJS tente ler ficheiros .wasm como JavaScript
      exclude: ['**/*.wasm', '**/node_modules/@icr/polyseg-wasm/**']
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});