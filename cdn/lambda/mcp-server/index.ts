import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { executeTool, tools, type ToolCallInput } from './tools.js'

interface MCPRequest {
  jsonrpc: '2.0'
  id?: string | number
  method: string
  params?: any
}

interface MCPResponse {
  jsonrpc: '2.0'
  id?: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

const MCP_VERSION = '2024-11-05'
const SERVER_INFO = {
  name: '@cal.macconnachie/web-components-mcp',
  version: '1.0.0',
  description: 'MCP server for Cal\'s Web Components Library'
}

function createResponse(statusCode: number, body: any): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(body)
  }
}

function createMCPResponse(id: string | number | undefined, result: any): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    result
  }
}

function createMCPError(id: string | number | undefined, code: number, message: string, data?: any): MCPResponse {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data
    }
  }
}

function handleInitialize(id: string | number | undefined): MCPResponse {
  return createMCPResponse(id, {
    protocolVersion: MCP_VERSION,
    serverInfo: SERVER_INFO,
    capabilities: {
      tools: {
        listChanged: false
      }
    }
  })
}

function handleListTools(id: string | number | undefined): MCPResponse {
  return createMCPResponse(id, {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  })
}

function handleCallTool(id: string | number | undefined, params: any): MCPResponse {
  if (!params || !params.name) {
    return createMCPError(id, -32602, 'Invalid params: name required')
  }

  const toolInput: ToolCallInput = {
    name: params.name,
    arguments: params.arguments || {}
  }

  try {
    const result = executeTool(toolInput)
    return createMCPResponse(id, result)
  } catch (error) {
    return createMCPError(
      id,
      -32000,
      'Tool execution error',
      error instanceof Error ? error.message : String(error)
    )
  }
}

function handleMCPRequest(request: MCPRequest): MCPResponse {
  const { method, id, params } = request

  switch (method) {
    case 'initialize':
      return handleInitialize(id)
    case 'tools/list':
      return handleListTools(id)
    case 'tools/call':
      return handleCallTool(id, params)
    case 'ping':
      return createMCPResponse(id, {})
    default:
      return createMCPError(id, -32601, `Method not found: ${method}`)
  }
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method
  const path = event.requestContext.http.path

  // Handle OPTIONS for CORS preflight
  if (method === 'OPTIONS') {
    return createResponse(200, {})
  }

  // Handle GET for server info
  if (method === 'GET') {
    return createResponse(200, {
      ...SERVER_INFO,
      protocolVersion: MCP_VERSION,
      endpoints: {
        mcp: 'POST /',
        health: 'GET /health'
      },
      documentation: 'https://cdn.cals-api.com/',
      tools: tools.map(t => ({
        name: t.name,
        description: t.description
      }))
    })
  }

  // Handle health check
  if (path === '/health') {
    return createResponse(200, {
      status: 'healthy',
      server: SERVER_INFO,
      timestamp: new Date().toISOString()
    })
  }

  // Handle MCP JSON-RPC requests
  if (method === 'POST') {
    try {
      if (!event.body) {
        return createResponse(400, createMCPError(undefined, -32700, 'Parse error: No body'))
      }

      const request: MCPRequest = JSON.parse(event.body)

      // Validate JSON-RPC 2.0
      if (request.jsonrpc !== '2.0') {
        return createResponse(400, createMCPError(
          request.id,
          -32600,
          'Invalid Request: jsonrpc must be "2.0"'
        ))
      }

      const response = handleMCPRequest(request)
      return createResponse(200, response)
    } catch (error) {
      if (error instanceof SyntaxError) {
        return createResponse(400, createMCPError(undefined, -32700, 'Parse error'))
      }

      return createResponse(500, createMCPError(
        undefined,
        -32603,
        'Internal error',
        error instanceof Error ? error.message : String(error)
      ))
    }
  }

  return createResponse(405, {
    error: 'Method not allowed',
    allowed: ['GET', 'POST', 'OPTIONS']
  })
}
