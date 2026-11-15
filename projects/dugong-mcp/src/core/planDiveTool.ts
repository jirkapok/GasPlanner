import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { planDive } from './planDive';
import { planDiveInputSchema } from './planDiveInput';
import { summaryText } from './planDiveResult';

export const planDiveToolName = 'plan_dive';

export const planDiveToolDescription = 'Plans a single level open circuit scuba dive with the Dugong Gas Planner ' +
    '(Bühlmann ZHL-16C with gradient factors): decompression stops, runtime, gas consumption and reserve per tank, ' +
    'oxygen toxicity (CNS, OTU), gas density and warnings. Metric units: meters, bars, liters, minutes, gas content in %. ' +
    'Defaults are the same as for a new dive in the application (fresh water, gradient factors 40/85, RMV 20 l/min). ' +
    'Multilevel, repetitive and rebreather dives are not supported. ' +
    'Always show the disclaimer to the user and never present the plan as authoritative.';

const decoStopSchema = z.object({ depth: z.number(), duration: z.number(), gas: z.string() });

const tankResultSchema = z.object({
    index: z.number(),
    gas: z.string(),
    size: z.number(),
    startPressure: z.number(),
    endPressure: z.number(),
    reservePressure: z.number(),
    consumedVolume: z.number(),
    hasReserve: z.boolean()
});

const eventSchema = z.object({ type: z.string(), runtime: z.number(), depth: z.number(), message: z.string() });

/** Structure of PlanDiveResult, see planDiveResult.ts for the units */
const planDiveOutputSchema = z.object({
    noDecoDive: z.boolean(),
    noDecoLimit: z.number().describe('min'),
    runtime: z.number().describe('min'),
    timeToSurface: z.number().describe('min, emergency ascent'),
    maxDepth: z.number().describe('m'),
    averageDepth: z.number().describe('m'),
    decoStops: z.array(decoStopSchema).describe('depth in m, duration in min, incl. gas switches and the safety stop'),
    tanks: z.array(tankResultSchema).describe('pressures in bar, volume in l'),
    cns: z.number().describe('%'),
    otu: z.number(),
    maxDensity: z.object({ density: z.number(), depth: z.number(), gas: z.string() }).describe('g/l at depth in m'),
    events: z.array(eventSchema).describe('warnings and errors, runtime in min, depth in m'),
    errors: z.array(z.string()).describe('the plan is not calculated when not empty'),
    disclaimer: z.string().describe('always show it to the user')
});

/** Registers the plan_dive tool, the input is validated by the server using the schema */
export const registerPlanDive = (server: McpServer): void => {
    server.registerTool(planDiveToolName, {
        title: 'Plan a scuba dive',
        description: planDiveToolDescription,
        inputSchema: planDiveInputSchema,
        outputSchema: planDiveOutputSchema,
        annotations: { readOnlyHint: true, openWorldHint: false }
    }, (input) => {
        const result = planDive(input);
        return {
            content: [{ type: 'text', text: summaryText(result) }],
            structuredContent: { ...result }
        };
    });
};
