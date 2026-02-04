import { componentSchemas, themeVariables, type ComponentSchema } from './schemas.js'
import { generateComponent, generateForm, type GenerateComponentInput } from './generator.js'

export interface ToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface ToolCallInput {
  name: string
  arguments: Record<string, any>
}

export interface ToolCallResult {
  content: Array<{
    type: 'text' | 'resource'
    text?: string
    resource?: {
      uri: string
      mimeType: string
      text: string
    }
  }>
  isError?: boolean
}

// Define all MCP tools
export const tools: ToolDefinition[] = [
  {
    name: 'list_components',
    description: 'List all available web components with their descriptions and categories',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: form, container, navigation, or utility',
          enum: ['form', 'container', 'navigation', 'utility']
        }
      }
    }
  },
  {
    name: 'get_component_schema',
    description: 'Get detailed schema for a specific component including props, slots, events, and examples',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: {
          type: 'string',
          description: 'Name of the component (e.g., base-button, base-input)'
        }
      },
      required: ['componentName']
    }
  },
  {
    name: 'generate_component',
    description: 'Generate HTML for a component with specified props and content',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: {
          type: 'string',
          description: 'Name of the component to generate'
        },
        props: {
          type: 'object',
          description: 'Component properties as key-value pairs',
          additionalProperties: true
        },
        content: {
          type: 'string',
          description: 'Inner HTML content of the component'
        },
        validate: {
          type: 'boolean',
          description: 'Whether to validate props against schema (default: true)',
          default: true
        }
      },
      required: ['componentName']
    }
  },
  {
    name: 'validate_component_config',
    description: 'Validate component configuration without generating HTML',
    inputSchema: {
      type: 'object',
      properties: {
        componentName: {
          type: 'string',
          description: 'Name of the component to validate'
        },
        props: {
          type: 'object',
          description: 'Component properties to validate',
          additionalProperties: true
        }
      },
      required: ['componentName', 'props']
    }
  },
  {
    name: 'get_theme_variables',
    description: 'Get all available CSS custom properties (theme variables) for styling',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: colors, spacing, typography, or layout',
          enum: ['colors', 'spacing', 'typography', 'layout']
        }
      }
    }
  },
  {
    name: 'generate_form',
    description: 'Generate a complete form with multiple input components',
    inputSchema: {
      type: 'object',
      properties: {
        inputs: {
          type: 'array',
          description: 'Array of form inputs to generate',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['input', 'textarea', 'select', 'date', 'time', 'datetime'],
                description: 'Type of input field'
              },
              label: {
                type: 'string',
                description: 'Label for the input'
              },
              name: {
                type: 'string',
                description: 'Name attribute for the input'
              },
              required: {
                type: 'boolean',
                description: 'Whether the field is required'
              },
              props: {
                type: 'object',
                description: 'Additional component-specific props',
                additionalProperties: true
              }
            },
            required: ['type', 'label', 'name']
          }
        }
      },
      required: ['inputs']
    }
  },
  {
    name: 'search_components',
    description: 'Search for components by keyword in name, description, or props',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        }
      },
      required: ['query']
    }
  }
]

// Tool execution handlers
export function executeTool(input: ToolCallInput): ToolCallResult {
  try {
    switch (input.name) {
      case 'list_components':
        return handleListComponents(input.arguments)
      case 'get_component_schema':
        return handleGetComponentSchema(input.arguments)
      case 'generate_component':
        return handleGenerateComponent(input.arguments)
      case 'validate_component_config':
        return handleValidateComponent(input.arguments)
      case 'get_theme_variables':
        return handleGetThemeVariables(input.arguments)
      case 'generate_form':
        return handleGenerateForm(input.arguments)
      case 'search_components':
        return handleSearchComponents(input.arguments)
      default:
        return {
          content: [{
            type: 'text',
            text: `Unknown tool: ${input.name}`
          }],
          isError: true
        }
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    }
  }
}

function handleListComponents(args: Record<string, any>): ToolCallResult {
  const { category } = args
  let components = componentSchemas

  if (category) {
    components = components.filter(c => c.category === category)
  }

  // Group by category
  const grouped = components.reduce((acc, comp) => {
    if (!acc[comp.category]) {
      acc[comp.category] = []
    }
    acc[comp.category].push(comp)
    return acc
  }, {} as Record<string, ComponentSchema[]>)

  let output = `# Available Web Components (${components.length})\n\n`
  output += `## Installation\n\n`
  output += `**Recommended**: Install via yarn\n\`\`\`bash\nyarn add @cal.macconnachie/web-components\n\`\`\`\n\n`
  output += `**Fallback**: Use CDN for projects without npm\n\`\`\`html\n<script type="module" src="https://cdn.cals-api.com/index.js"></script>\n\`\`\`\n\n`

  for (const [cat, comps] of Object.entries(grouped)) {
    output += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)} Components\n\n`
    for (const comp of comps) {
      output += `- **${comp.name}**: ${comp.description}\n`
    }
    output += '\n'
  }

  return {
    content: [{ type: 'text', text: output }]
  }
}

function handleGetComponentSchema(args: Record<string, any>): ToolCallResult {
  const { componentName } = args
  const schema = componentSchemas.find(c => c.name === componentName || c.tagName === componentName)

  if (!schema) {
    return {
      content: [{
        type: 'text',
        text: `Component '${componentName}' not found. Use list_components to see all available components.`
      }],
      isError: true
    }
  }

  let output = `# ${schema.name}\n\n`
  output += `${schema.description}\n\n`
  output += `**Category**: ${schema.category}\n\n`

  // Props
  output += `## Properties\n\n`
  for (const prop of schema.props) {
    output += `- **${prop.name}** (${prop.type})${prop.required ? ' *required*' : ''}\n`
    output += `  - ${prop.description}\n`
    if (prop.default !== undefined) {
      output += `  - Default: \`${JSON.stringify(prop.default)}\`\n`
    }
    if (prop.options && prop.options.length > 0) {
      output += `  - Options: ${prop.options.map(o => `\`${o}\``).join(', ')}\n`
    }
    output += '\n'
  }

  // Slots
  if (schema.slots && schema.slots.length > 0) {
    output += `## Slots\n\n`
    for (const slot of schema.slots) {
      output += `- ${slot.name ? `**${slot.name}**` : '**default**'}: ${slot.description}\n`
    }
    output += '\n'
  }

  // Events
  if (schema.events && schema.events.length > 0) {
    output += `## Events\n\n`
    for (const event of schema.events) {
      output += `- **${event.name}**: ${event.description}\n`
      if (event.detail) {
        output += `  - Detail: \`${event.detail}\`\n`
      }
    }
    output += '\n'
  }

  // Examples
  output += `## Examples\n\n`
  output += '```html\n'
  output += schema.examples.join('\n\n')
  output += '\n```\n'

  return {
    content: [{ type: 'text', text: output }]
  }
}

function handleGenerateComponent(args: Record<string, any>): ToolCallResult {
  const result = generateComponent(args as GenerateComponentInput)

  if (!result.success) {
    return {
      content: [{
        type: 'text',
        text: `Validation errors:\n${result.errors!.map(e => `- ${e}`).join('\n')}`
      }],
      isError: true
    }
  }

  return {
    content: [{
      type: 'text',
      text: `Generated component HTML:\n\n\`\`\`html\n${result.html}\n\`\`\``
    }]
  }
}

function handleValidateComponent(args: Record<string, any>): ToolCallResult {
  const { componentName, props } = args
  const result = generateComponent({ componentName, props, validate: true })

  if (!result.success) {
    return {
      content: [{
        type: 'text',
        text: `Validation failed:\n${result.errors!.map(e => `- ${e}`).join('\n')}`
      }],
      isError: true
    }
  }

  return {
    content: [{
      type: 'text',
      text: `✓ Configuration is valid for component '${componentName}'`
    }]
  }
}

function handleGetThemeVariables(args: Record<string, any>): ToolCallResult {
  const { category } = args
  let vars = category ? { [category]: themeVariables[category as keyof typeof themeVariables] } : themeVariables

  let output = `# CSS Theme Variables\n\n`

  for (const [cat, variables] of Object.entries(vars)) {
    output += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n\n`
    for (const varName of variables as string[]) {
      output += `- \`${varName}\`\n`
    }
    output += '\n'
  }

  output += `\n## Usage\n\n`
  output += `These variables can be used in your CSS:\n\n`
  output += `\`\`\`css\n`
  output += `.my-element {\n`
  output += `  color: var(--color-primary);\n`
  output += `  padding: var(--space-4);\n`
  output += `  border-radius: var(--radius-md);\n`
  output += `}\n`
  output += `\`\`\`\n`

  return {
    content: [{ type: 'text', text: output }]
  }
}

function handleGenerateForm(args: Record<string, any>): ToolCallResult {
  const { inputs } = args
  const result = generateForm(inputs)

  if (!result.success) {
    return {
      content: [{
        type: 'text',
        text: `Form generation errors:\n${result.errors!.map(e => `- ${e}`).join('\n')}`
      }],
      isError: true
    }
  }

  return {
    content: [{
      type: 'text',
      text: `Generated form HTML:\n\n\`\`\`html\n<form>\n  ${result.html}\n  \n  <base-button type="submit" variant="solid-primary">Submit</base-button>\n</form>\n\`\`\``
    }]
  }
}

function handleSearchComponents(args: Record<string, any>): ToolCallResult {
  const { query } = args
  const lowerQuery = query.toLowerCase()

  const results = componentSchemas.filter(comp => {
    // Search in name, description
    if (comp.name.toLowerCase().includes(lowerQuery)) return true
    if (comp.description.toLowerCase().includes(lowerQuery)) return true

    // Search in prop names and descriptions
    if (comp.props.some(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    )) return true

    return false
  })

  if (results.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `No components found matching "${query}"`
      }]
    }
  }

  let output = `# Search Results for "${query}" (${results.length})\n\n`
  for (const comp of results) {
    output += `## ${comp.name}\n`
    output += `${comp.description}\n\n`
    output += `**Category**: ${comp.category}\n`
    output += `**Props**: ${comp.props.map(p => p.name).join(', ')}\n\n`
  }

  return {
    content: [{ type: 'text', text: output }]
  }
}
