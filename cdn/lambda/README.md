# Web Components MCP Server

MCP (Model Context Protocol) server for Cal's Web Components Library, hosted as an AWS Lambda function.

## Endpoint

**Production**: `https://mcp.cdn.cals-api.com`

## Protocol

The server implements the MCP JSON-RPC 2.0 protocol over HTTP.

## Available Tools

### 1. `list_components`

List all available web components with their descriptions and categories.

**Parameters:**
- `category` (optional): Filter by category (`form`, `container`, `navigation`, `utility`)

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_components",
    "arguments": {
      "category": "form"
    }
  }
}
```

### 2. `get_component_schema`

Get detailed schema for a specific component including props, slots, events, and examples.

**Parameters:**
- `componentName` (required): Name of the component (e.g., `base-button`, `base-input`)

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_component_schema",
    "arguments": {
      "componentName": "base-button"
    }
  }
}
```

### 3. `generate_component`

Generate HTML for a component with specified props and content.

**Parameters:**
- `componentName` (required): Name of the component
- `props` (optional): Component properties as key-value pairs
- `content` (optional): Inner HTML content
- `validate` (optional): Whether to validate props (default: true)

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "generate_component",
    "arguments": {
      "componentName": "base-button",
      "props": {
        "variant": "solid-primary",
        "size": "md"
      },
      "content": "Click me"
    }
  }
}
```

### 4. `validate_component_config`

Validate component configuration without generating HTML.

**Parameters:**
- `componentName` (required): Name of the component
- `props` (required): Component properties to validate

### 5. `get_theme_variables`

Get all available CSS custom properties (theme variables) for styling.

**Parameters:**
- `category` (optional): Filter by category (`colors`, `spacing`, `typography`, `layout`)

### 6. `generate_form`

Generate a complete form with multiple input components.

**Parameters:**
- `inputs` (required): Array of form inputs with type, label, name, and optional props

**Example:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "generate_form",
    "arguments": {
      "inputs": [
        {
          "type": "input",
          "label": "Email",
          "name": "email",
          "required": true,
          "props": { "type": "email" }
        },
        {
          "type": "input",
          "label": "Password",
          "name": "password",
          "required": true,
          "props": { "type": "password" }
        }
      ]
    }
  }
}
```

### 7. `search_components`

Search for components by keyword in name, description, or props.

**Parameters:**
- `query` (required): Search query string

## Usage in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "web-components": {
      "url": "https://mcp.cdn.cals-api.com"
    }
  }
}
```

## Development

### Build

```bash
cd cdn/lambda
yarn install
yarn build
```

### Deploy

From the root directory:

```bash
yarn build:mcp-schemas  # Generate schemas from TypeScript
cd cdn/lambda
yarn build              # Build Lambda
cd ../..
yarn cdk:deploy         # Deploy to AWS
```

## Architecture

- **Lambda Runtime**: Node.js 20.x (ARM64)
- **Protocol**: MCP JSON-RPC 2.0 over HTTP
- **Transport**: Lambda Function URL → CloudFront
- **Subdomain**: mcp.cdn.cals-api.com
- **Schema Generation**: Automated from TypeScript component definitions

## Schema Generation

Component schemas are automatically generated from the TypeScript source files during build:

1. `scripts/generate-mcp-schemas.ts` parses component files
2. Extracts `@property` decorators, types, and defaults
3. Generates `cdn/lambda/mcp-server/schemas.ts`
4. Lambda bundles the generated schemas

This ensures the MCP server always has up-to-date component information.
