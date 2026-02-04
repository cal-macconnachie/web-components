import * as esbuild from 'esbuild'
import * as fs from 'fs'
import * as path from 'path'

// Bundle Lambda handler for deployment
await esbuild.build({
  entryPoints: ['dist/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/bundle.js',
  minify: true,
  sourcemap: false,
  external: [],
  banner: {
    js: '// @cal.macconnachie/web-components MCP Lambda\n'
  }
})

console.log('✅ Lambda bundled successfully')
