import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { serverName, serverVersion } from './version';

/** Creates the Dugong MCP server with all its tools, independent of the transport */
export const createServer = (): McpServer => new McpServer({ name: serverName, version: serverVersion });
