import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  worker: {
    plugins: () => [
      wasm(),
      topLevelAwait()
    ]
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      ignore: ['@icr/polyseg-wasm']
    },
    // Força o empacotador a ignorar dependências internas do WASM
    rollupOptions: {
      external: ['a']
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});