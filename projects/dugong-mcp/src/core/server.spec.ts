import { createServer } from './server';
import { connectClient } from './testing/client.testing';

describe('MCP server', () => {
    it('starts with server name and version', async () => {
        const client = await connectClient(createServer());
        expect(client.getServerVersion()).toEqual({ name: 'dugong', version: '0.0.0-dev' });
    });
});
