import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

/** Connects a test client to the server through the in-memory transport */
export const connectClient = async (server: McpServer): Promise<Client> => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'dugong-test-client', version: '1.0.0' });
    await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport)
    ]);
    return client;
};
