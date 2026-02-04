import { componentSchemas, type ComponentSchema, type PropSchema } from './schemas.js'

export interface GenerateComponentInput {
  componentName: string
  props?: Record<string, any>
  content?: string
  validate?: boolean
}

export interface GenerateComponentResult {
  success: boolean
  html?: string
  errors?: string[]
}

function validateProp(prop: PropSchema, value: any): string | null {
  // Check required
  if (prop.required && (value === undefined || value === null || value === '')) {
    return `Property '${prop.name}' is required`
  }

  // Skip validation if no value provided and not required
  if (value === undefined || value === null) {
    return null
  }

  // Type validation
  const valueType = typeof value
  if (prop.type === 'boolean') {
    if (valueType !== 'boolean' && value !== 'true' && value !== 'false') {
      return `Property '${prop.name}' must be a boolean`
    }
  } else if (prop.type === 'number') {
    const num = Number(value)
    if (isNaN(num)) {
      return `Property '${prop.name}' must be a number`
    }
  } else if (prop.type === 'string' && valueType !== 'string') {
    return `Property '${prop.name}' must be a string`
  }

  // Options validation
  if (prop.options && prop.options.length > 0) {
    const stringValue = String(value)
    if (!prop.options.includes(stringValue)) {
      return `Property '${prop.name}' must be one of: ${prop.options.join(', ')}`
    }
  }

  return null
}

function formatAttributeValue(prop: PropSchema, value: any): string {
  if (prop.type === 'boolean') {
    // Boolean attributes: present = true, absent = false
    return value === true || value === 'true' ? '' : ''
  } else if (prop.type === 'number') {
    return String(value)
  } else {
    // Escape quotes in string values
    return String(value).replace(/"/g, '&quot;')
  }
}

export function generateComponent(input: GenerateComponentInput): GenerateComponentResult {
  const { componentName, props = {}, content = '', validate = true } = input

  // Find component schema
  const schema = componentSchemas.find(c => c.name === componentName || c.tagName === componentName)
  if (!schema) {
    return {
      success: false,
      errors: [`Component '${componentName}' not found`]
    }
  }

  const errors: string[] = []

  // Validate props if requested
  if (validate) {
    for (const propSchema of schema.props) {
      const value = props[propSchema.name]
      const error = validateProp(propSchema, value)
      if (error) {
        errors.push(error)
      }
    }

    if (errors.length > 0) {
      return { success: false, errors }
    }
  }

  // Build attributes
  const attributes: string[] = []
  for (const [key, value] of Object.entries(props)) {
    // Find prop schema to determine type
    const propSchema = schema.props.find(p => p.name === key)

    if (!propSchema) {
      // Unknown prop, skip in strict validation mode
      if (validate) {
        errors.push(`Unknown property '${key}' for component '${componentName}'`)
        continue
      }
    }

    if (value !== undefined && value !== null) {
      if (propSchema && propSchema.type === 'boolean') {
        // Boolean attribute: only add if true
        if (value === true || value === 'true') {
          attributes.push(key)
        }
      } else {
        const formattedValue = propSchema ? formatAttributeValue(propSchema, value) : String(value).replace(/"/g, '&quot;')
        attributes.push(`${key}="${formattedValue}"`)
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  // Build HTML
  const attrString = attributes.length > 0 ? ' ' + attributes.join(' ') : ''
  const html = content
    ? `<${schema.tagName}${attrString}>${content}</${schema.tagName}>`
    : `<${schema.tagName}${attrString}></${schema.tagName}>`

  return {
    success: true,
    html
  }
}

export function generateForm(inputs: Array<{
  type: 'input' | 'textarea' | 'select' | 'date' | 'time' | 'datetime'
  label: string
  name: string
  required?: boolean
  props?: Record<string, any>
}>): GenerateComponentResult {
  const errors: string[] = []
  const components: string[] = []

  for (const input of inputs) {
    let componentName: string
    switch (input.type) {
      case 'input':
        componentName = 'base-input'
        break
      case 'textarea':
        componentName = 'base-textarea'
        break
      case 'select':
        componentName = 'base-select'
        break
      case 'date':
        componentName = 'base-date-picker'
        break
      case 'time':
        componentName = 'base-time-picker'
        break
      case 'datetime':
        componentName = 'base-datetime-picker'
        break
      default:
        errors.push(`Unknown input type: ${input.type}`)
        continue
    }

    const props = {
      label: input.label,
      name: input.name,
      required: input.required,
      ...input.props
    }

    const result = generateComponent({ componentName, props, validate: true })
    if (!result.success) {
      errors.push(...(result.errors || []))
    } else {
      components.push(result.html!)
    }
  }

  if (errors.length > 0) {
    return { success: false, errors }
  }

  const html = components.join('\n  ')
  return {
    success: true,
    html
  }
}
