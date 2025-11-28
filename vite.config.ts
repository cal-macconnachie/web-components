import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
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
      output: {
        entryFileNames: 'index.js'
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
