import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  // Aplica os plugins especificamente aos Web Workers do Cornerstone
  worker: {
    plugins: () => [
      wasm(),
      topLevelAwait()
    ]
  },
  build: {
    // Necessário para suportar WebAssembly moderno e Top-Level Await
    target: 'esnext',
    // Impede que o conversor padrão do Vite tente processar o Wasm de forma errada
    commonjsOptions: {
      ignore: ['@icr/polyseg-wasm']
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});