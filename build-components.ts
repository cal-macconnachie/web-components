import { build } from 'vite'
import { resolve, basename } from 'path'
import { readdir } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dts from 'vite-plugin-dts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get all component files
const componentsDir = resolve(__dirname, 'src/components')
const componentFiles = await readdir(componentsDir)
const components = componentFiles.filter(file => file.endsWith('.ts'))

console.log(`Found ${components.length} components:`, components)

// Build each component individually
for (const component of components) {
  const componentName = basename(component, '.ts')
  const componentPath = resolve(componentsDir, component)

  console.log(`\nBuilding ${componentName}...`)

  await build({
    configFile: false,
    envPrefix: ['VITE_', 'COGNITO_'],
    build: {
      outDir: `dist/components`,
      emptyOutDir: false,
      minify: 'esbuild',
      target: 'esnext',
      lib: {
        entry: componentPath,
        name: componentName,
        fileName: componentName,
        formats: ['es']
      },
      rollupOptions: {
        external: ['lit'],
        output: {
          entryFileNames: componentName,
          globals: { lit: 'Lit' },
          compact: true,
          generatedCode: {
            constBindings: true
          }
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
        include: [componentPath, 'src/services/**/*.ts', 'src/global.d.ts'],
        entryRoot: 'src',
        rollupTypes: true,
        outDir: `dist/components`
      })
    ]
  })

  console.log(`✓ ${componentName} built successfully`)
}

console.log('\n✓ All components built successfully!')
