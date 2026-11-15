import { z } from 'zod';
import { Diver, MetricRanges, OptionDefaults } from 'scuba-physics';

/** Same validation ranges as the application in metric units */
const ranges = new MetricRanges();
/** Gradient factors range in %, see ValidatorGroups.minGradient and maxGradient in the planner */
const gradientRange: [number, number] = [10, 120];
/** Gas switch and problem solving durations range in minutes, see ValidatorGroups.duration100 in the planner */
const duration100Range: [number, number] = [1, 100];
const defaultGfLow = OptionDefaults.gfLow * 100;
const defaultGfHigh = OptionDefaults.gfHigh * 100;

const inRange = (range: [number, number], unit: string, description: string): z.ZodNumber => {
    const message = `Must be between ${range[0]} and ${range[1]} ${unit}`.trimEnd();
    return z.number()
        .min(range[0], { error: message })
        .max(range[1], { error: message })
        .describe(description);
};

const tankSchema = z.strictObject({
    size: inRange(ranges.tankSize, 'l', 'Water volume of the tank in liters, e.g. 15 for a 15 l tank.'),
    startPressure: inRange(ranges.tankPressure, 'bar', 'Pressure of the filled tank at the start of the dive in bars.'),
    o2: inRange(ranges.trimixOxygen, '%', 'Oxygen content of the gas in %, e.g. 21 for air, 32 for EAN32.'),
    he: inRange(ranges.tankHe, '%', 'Helium content of the gas in %, default 0 (air or nitrox).').optional()
})
    .refine(tank => tank.o2 + (tank.he ?? 0) <= 100, { error: 'Oxygen and helium content together must not exceed 100 %' })
    .describe('Tank with its gas.');

const optionsSchema = z.strictObject({
    gfLow: inRange(gradientRange, '%', `Gradient factor low in %, default ${defaultGfLow}.`).optional(),
    gfHigh: inRange(gradientRange, '%', `Gradient factor high in %, default ${defaultGfHigh}.`).optional(),
    salinity: z.enum(['fresh', 'brackish', 'salt']).describe('Water salinity, default fresh.').optional(),
    altitude: inRange(ranges.altitude, 'm', `Altitude of the dive site above the sea level in meters, default ${OptionDefaults.altitude}.`)
        .optional(),
    maxPpO2: inRange(ranges.ppO2, 'bar', `Maximum oxygen partial pressure at the bottom in bars, default ${OptionDefaults.maxPpO2}.`)
        .optional(),
    maxDecoPpO2: inRange(ranges.ppO2, 'bar',
        `Maximum oxygen partial pressure during the decompression in bars, default ${OptionDefaults.maxDecoPpO2}.`).optional(),
    ascentSpeed50perc: inRange(ranges.speed, 'm/min',
        `Ascent speed from the bottom to 50 % of the average depth in meters/minute, default ${OptionDefaults.ascentSpeed50perc}.`)
        .optional(),
    ascentSpeed50percTo6m: inRange(ranges.speed, 'm/min',
        `Ascent speed from 50 % of the average depth to 6 m in meters/minute, default ${OptionDefaults.ascentSpeed50percTo6m}.`)
        .optional(),
    ascentSpeed6m: inRange(ranges.speed, 'm/min',
        `Ascent speed from 6 m to the surface in meters/minute, default ${OptionDefaults.ascentSpeed6m}.`).optional(),
    descentSpeed: inRange(ranges.speed, 'm/min', `Descent speed in meters/minute, default ${OptionDefaults.descentSpeed}.`).optional(),
    lastStopDepth: inRange(ranges.lastStopDepth, 'm',
        `Depth of the last decompression stop in meters, default ${OptionDefaults.lastStopDepth}.`).optional(),
    safetyStop: z.enum(['never', 'auto', 'always'])
        .describe('Safety stop at 3 m (5 m for last stop at 6 m): auto adds it to dives deeper than 10 m, default auto.').optional(),
    gasSwitchDuration: inRange(duration100Range, 'min',
        `Duration of a gas switch in minutes, default ${OptionDefaults.gasSwitchDuration}.`).optional(),
    problemSolvingDuration: inRange(duration100Range, 'min',
        `Time to solve a problem at the bottom before the emergency ascent in minutes, default ${OptionDefaults.problemSolvingDuration}.`)
        .optional()
})
    .refine(options => (options.gfLow ?? defaultGfLow) <= (options.gfHigh ?? defaultGfHigh),
        { error: 'Gradient factor low must not be higher than gradient factor high' })
    .describe('Planning options, defaults equal to a new dive in the application.');

const diverSchema = z.strictObject({
    rmv: inRange(ranges.diverRmv, 'l/min',
        `Respiratory minute volume (surface air consumption) in liters/minute, default ${Diver.defaultSac}.`).optional(),
    stressRmv: inRange(ranges.diverRmv, 'l/min',
        'Respiratory minute volume under stress (emergency ascent) in liters/minute, default 1.5 x rmv.').optional()
}).describe('Diver gas consumption.');

/** Input of the plan_dive tool and Skill command, in metric units */
export const planDiveInputSchema = z.strictObject({
    depth: z.number()
        .gt(0, { error: `Must be more than 0 m and at most ${ranges.depth[1]} m` })
        .max(ranges.depth[1], { error: `Must be more than 0 m and at most ${ranges.depth[1]} m` })
        .describe('Maximum depth of the dive in meters.'),
    bottomTime: inRange(ranges.duration, 'min',
        'Bottom time in minutes from the start of the dive (including the descent) to the start of the ascent.'),
    tanks: z.array(tankSchema)
        .min(1, { error: 'At least one tank is required' })
        .describe('Tanks of the dive, the first one is the bottom gas, the others are decompression gases.'),
    options: optionsSchema.optional(),
    diver: diverSchema.optional()
}).describe('Single level open circuit dive.');

export type PlanDiveInput = z.infer<typeof planDiveInputSchema>;
