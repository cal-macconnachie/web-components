import { defineConfig } from 'vite'

export default defineConfig({
  root: '.', // Root is the project root
  publicDir: 'public', // Explicitly specify public directory
  build: {
    outDir: 'dist-playground',
    emptyOutDir: true,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      input: './index.html', // Entry point is the index.html
    }
  },
  esbuild: {
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
})
