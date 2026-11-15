import { planDiveInputSchema } from './planDiveInput';

describe('plan_dive input schema', () => {
    const air = { depth: 30, bottomTime: 20, tanks: [{ size: 15, startPressure: 200, o2: 21 }] };

    /** Validation fails with a readable message on an issue, whose path starts with the given path */
    const expectError = (input: unknown, path: string): void => {
        const result = planDiveInputSchema.safeParse(input);
        expect(result.success).toBe(false);
        const issues = result.error?.issues ?? [];
        const issue = issues.find(i => i.path.join('.').startsWith(path));
        expect(issue).toBeDefined();
        expect(issue?.message.length).toBeGreaterThan(0);
    };

    it('accepts minimal air dive', () => {
        expect(planDiveInputSchema.safeParse(air).success).toBe(true);
    });

    it('accepts all options', () => {
        const input = {
            ...air,
            tanks: [{ size: 24, startPressure: 200, o2: 18, he: 45 }, { size: 11, startPressure: 200, o2: 50 }],
            options: {
                gfLow: 30, gfHigh: 70, salinity: 'salt', altitude: 300, maxPpO2: 1.3, maxDecoPpO2: 1.6,
                ascentSpeed50perc: 9, ascentSpeed50percTo6m: 6, ascentSpeed6m: 3, descentSpeed: 20,
                lastStopDepth: 6, safetyStop: 'always', gasSwitchDuration: 2, problemSolvingDuration: 2
            },
            diver: { rmv: 18, stressRmv: 30 }
        };
        expect(planDiveInputSchema.safeParse(input).success).toBe(true);
    });

    it('rejects o2 and he above 100 %', () => {
        expectError({ ...air, tanks: [{ size: 15, startPressure: 200, o2: 50, he: 60 }] }, 'tanks.0');
    });

    it('rejects helium without oxygen', () => {
        expectError({ ...air, tanks: [{ size: 15, startPressure: 200, he: 60 }] }, 'tanks.0.o2');
    });

    it('rejects zero depth', () => {
        expectError({ ...air, depth: 0 }, 'depth');
    });

    it('rejects depth deeper than 350 m', () => {
        expectError({ ...air, depth: 351 }, 'depth');
    });

    it('rejects bottom time out of range', () => {
        expectError({ ...air, bottomTime: 0 }, 'bottomTime');
    });

    it('rejects missing tanks', () => {
        expectError({ ...air, tanks: [] }, 'tanks');
    });

    it('rejects tank size out of range', () => {
        expectError({ ...air, tanks: [{ size: 51, startPressure: 200, o2: 21 }] }, 'tanks.0.size');
    });

    it('rejects gradient factor out of range', () => {
        expectError({ ...air, options: { gfHigh: 121 } }, 'options.gfHigh');
    });

    it('rejects gfLow above gfHigh', () => {
        expectError({ ...air, options: { gfLow: 90, gfHigh: 80 } }, 'options');
    });

    it('rejects unknown salinity', () => {
        expectError({ ...air, options: { salinity: 'sea' } }, 'options.salinity');
    });

    it('rejects rmv out of range', () => {
        expectError({ ...air, diver: { rmv: 4 } }, 'diver.rmv');
    });

    it('rejects unknown field', () => {
        expectError({ ...air, levels: [] }, '');
    });
});
