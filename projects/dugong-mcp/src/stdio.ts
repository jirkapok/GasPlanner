import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './core/server';

// Entry point of the MCP server bundled into the .mcpb, no logic here
await createServer().connect(new StdioServerTransport());
