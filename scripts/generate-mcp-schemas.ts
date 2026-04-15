import * as fs from 'fs'
import * as path from 'path'

interface ComponentSchema {
  name: string
  tagName: string
  description: string
  category: 'form' | 'container' | 'navigation' | 'utility'
  props: PropSchema[]
  slots?: SlotSchema[]
  events?: EventSchema[]
  examples: string[]
}

interface PropSchema {
  name: string
  type: string
  required: boolean
  default?: any
  description: string
  options?: string[]
}

interface SlotSchema {
  name?: string
  description: string
}

interface EventSchema {
  name: string
  description: string
  detail?: string
}

// Component metadata - manually curated for better descriptions
const componentMetadata: Record<string, {
  description: string
  category: 'form' | 'container' | 'navigation' | 'utility'
  examples: string[]
  slotDescriptions?: Record<string, string>
  eventDescriptions?: Record<string, { description: string; detail?: string }>
}> = {
  'base-button': {
    description: 'Versatile button component with multiple variants and sizes',
    category: 'form',
    examples: [
      '<base-button variant="solid-primary">Click me</base-button>',
      '<base-button variant="outlined-danger" size="sm">Delete</base-button>',
      '<base-button variant="ghost-primary" loading="true">Loading...</base-button>'
    ],
    slotDescriptions: {
      '': 'Button text content',
      'loading': 'Custom loading indicator'
    }
  },
  'base-input': {
    description: 'Text input field with validation and label support',
    category: 'form',
    examples: [
      '<base-input label="Email" type="email" placeholder="you@example.com"></base-input>',
      '<base-input label="Password" type="password" required="true"></base-input>',
      '<base-input label="Phone" type="tel" hint="Include country code"></base-input>'
    ],
    slotDescriptions: {
      'suffix': 'Content displayed at the end of the input'
    },
    eventDescriptions: {
      'input': { description: 'Fired when input value changes', detail: '{ value: string }' },
      'focus': { description: 'Fired when input receives focus' },
      'blur': { description: 'Fired when input loses focus' }
    }
  },
  'base-card': {
    description: 'Container card component with variants and expandable support',
    category: 'container',
    examples: [
      '<base-card variant="elevated" padding="md"><h2>Card Title</h2><p>Card content</p></base-card>',
      '<base-card expandable="true" padding="lg">Click expand icon to view fullscreen</base-card>'
    ],
    slotDescriptions: {
      '': 'Card content'
    },
    eventDescriptions: {
      'card-expanded': { description: 'Fired when card is expanded' },
      'card-collapsed': { description: 'Fired when expanded card is collapsed' }
    }
  },
  'base-select': {
    description: 'Dropdown select component with search and multi-select support',
    category: 'form',
    examples: [
      '<base-select label="Country" placeholder="Choose country"></base-select>',
      '<base-select label="Tags" multiple="true" searchable="true" creatable="true"></base-select>'
    ]
  },
  'base-textarea': {
    description: 'Multi-line text input component',
    category: 'form',
    examples: [
      '<base-textarea label="Message" placeholder="Enter your message..." rows="5"></base-textarea>'
    ]
  },
  'base-drawer': {
    description: 'Bottom slide-out drawer with iOS-like behavior and drag support',
    category: 'container',
    examples: [
      '<base-drawer open="true" detents="300px,80%"><div>Drawer content</div></base-drawer>'
    ],
    eventDescriptions: {
      'drawer-open': { description: 'Fired when drawer opens' },
      'drawer-close': { description: 'Fired when drawer closes' }
    }
  },
  'base-tabs': {
    description: 'Tab navigation component with horizontal and sidebar layouts',
    category: 'navigation',
    examples: [
      '<base-tabs><base-tab label="Tab 1">Content 1</base-tab><base-tab label="Tab 2">Content 2</base-tab></base-tabs>',
      '<base-tabs layout="sidebar"><base-tab label="Settings">Settings content</base-tab></base-tabs>'
    ],
    slotDescriptions: {
      '': 'base-tab components'
    }
  },
  'base-tab': {
    description: 'Individual tab component (must be child of base-tabs)',
    category: 'navigation',
    examples: [
      '<base-tab label="Overview">Tab content here</base-tab>'
    ],
    slotDescriptions: {
      '': 'Tab content'
    }
  },
  'base-list': {
    description: 'List container component',
    category: 'container',
    examples: [
      '<base-list><base-list-item>Item 1</base-list-item><base-list-item>Item 2</base-list-item></base-list>'
    ],
    slotDescriptions: {
      '': 'base-list-item components'
    }
  },
  'base-list-item': {
    description: 'List item with swipe actions for mobile',
    category: 'container',
    examples: [
      '<base-list-item>Item content<div slot="actions"><button>Delete</button></div></base-list-item>'
    ],
    slotDescriptions: {
      '': 'List item content',
      'actions': 'Swipe action buttons'
    }
  },
  'base-date-picker': {
    description: 'Date selection input',
    category: 'form',
    examples: [
      '<base-date-picker label="Birth Date" required="true"></base-date-picker>'
    ]
  },
  'base-time-picker': {
    description: 'Time selection input',
    category: 'form',
    examples: [
      '<base-time-picker label="Appointment Time"></base-time-picker>'
    ]
  },
  'base-datetime-picker': {
    description: 'Combined date and time selection',
    category: 'form',
    examples: [
      '<base-datetime-picker label="Event Start Time"></base-datetime-picker>'
    ]
  },
  'quantity-select': {
    description: 'Numeric input with increment/decrement controls',
    category: 'form',
    examples: [
      '<quantity-select value="1" min="0" max="10"></quantity-select>'
    ]
  },
  'theme-toggle': {
    description: 'Light/dark theme switcher button',
    category: 'utility',
    examples: [
      '<theme-toggle></theme-toggle>'
    ]
  },
  'base-icon': {
    description: 'Icon display component',
    category: 'utility',
    examples: [
      '<base-icon name="check" size="lg"></base-icon>'
    ]
  },
  'base-toast': {
    description: 'Toast notification component',
    category: 'utility',
    examples: [
      'showToast({ message: "Saved successfully!", variant: "success" })'
    ]
  },
  'auth-form': {
    description: 'Authentication form component with login/signup modes',
    category: 'form',
    examples: [
      '<auth-form mode="login"></auth-form>',
      '<auth-form mode="signup"></auth-form>'
    ]
  }
}

// Property descriptions based on common patterns
const propDescriptions: Record<string, string> = {
  'variant': 'Visual style variant',
  'size': 'Size of the component',
  'disabled': 'Whether the component is disabled',
  'required': 'Whether the field is required',
  'loading': 'Show loading state',
  'full-width': 'Make component full width',
  'type': 'Component type',
  'value': 'Component value',
  'label': 'Label text displayed',
  'placeholder': 'Placeholder text',
  'error': 'Error message to display',
  'hint': 'Help text displayed',
  'autocomplete': 'HTML autocomplete attribute',
  'padding': 'Internal padding size',
  'hoverable': 'Show hover effects',
  'expandable': 'Allow expansion to fullscreen',
  'open': 'Whether component is open',
  'detents': 'Comma-separated detent heights',
  'layout': 'Layout style',
  'active': 'Whether component is active',
  'rows': 'Number of visible rows',
  'multiple': 'Allow multiple selections',
  'searchable': 'Enable search functionality',
  'creatable': 'Allow creating new options',
  'min': 'Minimum value',
  'max': 'Maximum value',
  'name': 'Component name/identifier',
  'message': 'Message text',
  'duration': 'Display duration in milliseconds',
  'mode': 'Component mode',
  'hover': 'Hover state variant'
}

function parseTypeUnion(typeStr: string): string[] {
  // Extract union type values from type definitions like 'solid-primary' | 'solid-secondary'
  const matches = typeStr.match(/'([^']+)'/g)
  if (matches) {
    return matches.map(m => m.replace(/'/g, ''))
  }
  return []
}

function extractPropsFromComponent(filePath: string, componentName: string): PropSchema[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const props: PropSchema[] = []

  // Extract type definitions (e.g., type ButtonVariant = 'solid' | 'outline')
  const typeMap: Record<string, string[]> = {}
  const typeRegex = /type\s+(\w+)\s*=\s*([^;\n]+)/g
  let typeMatch
  while ((typeMatch = typeRegex.exec(content)) !== null) {
    const [, typeName, typeValue] = typeMatch
    typeMap[typeName] = parseTypeUnion(typeValue)
  }

  // Extract @property decorators and their definitions
  const propRegex = /@property\(\{([^}]+)\}\)\s+(\w+)(\?)?(?::\s*([^=\n]+?))?(?:\s*=\s*([^;\n]+))?[;\n]/g
  let match

  while ((match = propRegex.exec(content)) !== null) {
    const [, decoratorArgs, propName, optionalMarker, propType, defaultValue] = match

    // Parse decorator arguments
    const typeMatch = decoratorArgs.match(/type:\s*(\w+)/)
    const reflectMatch = decoratorArgs.match(/reflect:\s*(true|false)/)
    const attributeMatch = decoratorArgs.match(/attribute:\s*'([^']+)'/)

    let type = 'string'
    if (typeMatch) {
      const decoratorType = typeMatch[1]
      if (decoratorType === 'String') type = 'string'
      else if (decoratorType === 'Number') type = 'number'
      else if (decoratorType === 'Boolean') type = 'boolean'
      else if (decoratorType === 'Array') type = 'array'
      else if (decoratorType === 'Object') type = 'object'
    }

    // Get actual TypeScript type if available
    let tsType = propType?.trim()
    let options: string[] | undefined

    // Check if type is a reference to a type alias
    if (tsType && typeMap[tsType]) {
      options = typeMap[tsType]
      type = 'string' // Union types are strings
    } else if (tsType) {
      const inlineOptions = parseTypeUnion(tsType)
      if (inlineOptions.length > 0) {
        options = inlineOptions
        type = 'string'
      }
    }

    // Parse default value
    let parsedDefault: any
    if (defaultValue) {
      const trimmed = defaultValue.trim()
      if (trimmed === 'true') parsedDefault = true
      else if (trimmed === 'false') parsedDefault = false
      else if (trimmed.match(/^\d+$/)) parsedDefault = parseInt(trimmed)
      else if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
        parsedDefault = trimmed.slice(1, -1)
      }
    }

    const attributeName = attributeMatch ? attributeMatch[1] : propName
    const description = propDescriptions[propName] || `${propName} property`

    props.push({
      name: attributeName,
      type,
      required: !optionalMarker && parsedDefault === undefined && type !== 'boolean',
      default: parsedDefault,
      description,
      options
    })
  }

  return props
}

function generateSchemas() {
  const componentsDir = path.join(process.cwd(), 'src', 'components')
  const componentFiles = fs.readdirSync(componentsDir).filter(f => f.endsWith('.ts'))

  const schemas: ComponentSchema[] = []

  for (const file of componentFiles) {
    const componentName = file.replace('.ts', '')
    const filePath = path.join(componentsDir, file)

    const metadata = componentMetadata[componentName]
    if (!metadata) {
      console.warn(`⚠️  No metadata found for ${componentName}, skipping`)
      continue
    }

    const props = extractPropsFromComponent(filePath, componentName)

    // Build slots array
    const slots: SlotSchema[] | undefined = metadata.slotDescriptions ?
      Object.entries(metadata.slotDescriptions).map(([name, description]) => ({
        name: name || undefined,
        description
      })) : undefined

    // Build events array
    const events: EventSchema[] | undefined = metadata.eventDescriptions ?
      Object.entries(metadata.eventDescriptions).map(([name, info]) => ({
        name,
        description: info.description,
        detail: info.detail
      })) : undefined

    schemas.push({
      name: componentName,
      tagName: componentName,
      description: metadata.description,
      category: metadata.category,
      props,
      slots,
      events,
      examples: metadata.examples
    })
  }

  // Sort by category then name
  schemas.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.name.localeCompare(b.name)
  })

  // Generate the TypeScript file
  const output = `// This file is auto-generated by scripts/generate-mcp-schemas.ts
// DO NOT EDIT MANUALLY - changes will be overwritten

export interface ComponentSchema {
  name: string
  tagName: string
  description: string
  category: 'form' | 'container' | 'navigation' | 'utility'
  props: PropSchema[]
  slots?: SlotSchema[]
  events?: EventSchema[]
  examples: string[]
}

export interface PropSchema {
  name: string
  type: string
  required: boolean
  default?: any
  description: string
  options?: string[]
}

export interface SlotSchema {
  name?: string
  description: string
}

export interface EventSchema {
  name: string
  description: string
  detail?: string
}

export const componentSchemas: ComponentSchema[] = ${JSON.stringify(schemas, null, 2)}

export const themeVariables = {
  colors: [
    '--color-primary',
    '--color-primary-hover',
    '--color-primary-light',
    '--color-secondary',
    '--color-secondary-hover',
    '--color-success',
    '--color-error',
    '--color-warning',
    '--color-info',
    '--color-bg-primary',
    '--color-bg-secondary',
    '--color-bg-muted',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-text-muted',
    '--color-text-inverse',
    '--color-border',
    '--color-border-hover',
    '--color-border-focus'
  ],
  spacing: [
    '--space-1',
    '--space-2',
    '--space-3',
    '--space-4',
    '--space-5',
    '--space-6',
    '--space-8',
    '--space-10',
    '--space-12'
  ],
  typography: [
    '--font-family-sans',
    '--font-size-xs',
    '--font-size-sm',
    '--font-size-base',
    '--font-size-lg',
    '--font-size-xl',
    '--font-weight-normal',
    '--font-weight-medium',
    '--font-weight-bold'
  ],
  layout: [
    '--radius-sm',
    '--radius-md',
    '--radius-lg',
    '--radius-full',
    '--shadow-sm',
    '--shadow-md',
    '--shadow-lg'
  ]
}
`

  // Write to output file
  const outputPath = path.join(process.cwd(), 'cdn', 'lambda', 'mcp-server', 'schemas.ts')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, output)

  console.log(`✅ Generated schemas for ${schemas.length} components`)
  console.log(`📝 Output: ${outputPath}`)
}

generateSchemas()
