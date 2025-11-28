import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    minify: 'esbuild',
    target: 'esnext',
    lib: {
      entry: 'src/index.ts',
      name: 'LitWebComponent',
      fileName: 'index.js',
      formats: ['es']
    },
    rollupOptions: {
      external: ['lit'],
      output: {
        entryFileNames: 'index.js',
        globals: { lit: 'Lit' }
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  },
  plugins: [
    dts({
      include: ['src'],
      entryRoot: 'src',
      rollupTypes: true
    })
  ]
});
