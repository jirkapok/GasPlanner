import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerPlanDive } from './planDiveTool';
import { serverName, serverVersion } from './version';

/** Creates the Dugong MCP server with all its tools, independent of the transport */
export const createServer = (): McpServer => {
    const server = new McpServer({ name: serverName, version: serverVersion });
    registerPlanDive(server);
    return server;
};
