import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { EventType, PlanningTasks } from 'scuba-physics';
import { planDive } from './planDive';
import { disclaimer } from './planDiveResult';
import { createServer } from './server';
import { connectClient } from './testing/client.testing';

describe('plan_dive MCP tool', () => {
    const air18m20min = { depth: 18, bottomTime: 20, tanks: [{ size: 15, startPressure: 200, o2: 21 }] };
    let client: Client;

    beforeEach(async () => {
        client = await connectClient(createServer());
    });

    const textOf = (response: Awaited<ReturnType<Client['callTool']>>): string =>
        (response.content as { type: string; text: string }[]).map(c => c.text).join('\n');

    it('lists plan_dive tool', async () => {
        const tools = (await client.listTools()).tools;
        expect(tools.map(t => t.name)).toEqual(['plan_dive']);
        expect(tools[0].description).toContain('disclaimer');
        expect(tools[0].inputSchema.properties).toHaveProperty('depth');
    });

    it('plans a dive', async () => {
        const response = await client.callTool({ name: 'plan_dive', arguments: air18m20min });
        expect(response.isError).toBeFalsy();
        expect(response.structuredContent).toEqual(planDive(air18m20min));
        expect(textOf(response)).toContain(disclaimer);
    });

    it('rejects invalid input with readable message', async () => {
        const response = await client.callTool({ name: 'plan_dive', arguments: { ...air18m20min, depth: 0 } });
        expect(response.isError).toBe(true);
        expect(textOf(response)).toContain('depth');
    });

    // validated open circuit input can't produce an algorithm error, the profile errors come only from invalid plans
    it('explains a plan which can\'t be calculated', async () => {
        vi.spyOn(PlanningTasks, 'calculateDecompression').mockReturnValue({
            diveId: 1,
            profile: {
                segments: [], finalTissues: [],
                errors: [{ timeStamp: 0, depth: 0, type: EventType.error, message: 'At least one bottom gas has to be defined.' }]
            }
        });
        const response = await client.callTool({ name: 'plan_dive', arguments: air18m20min });
        expect(response.isError).toBeFalsy();
        expect(textOf(response)).toContain('At least one bottom gas has to be defined.');
        expect(textOf(response)).toContain(disclaimer);
    });
});
