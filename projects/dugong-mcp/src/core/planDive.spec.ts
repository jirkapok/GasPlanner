import { EventType, PlanningTasks } from 'scuba-physics';
import { planDive } from './planDive';
import { appReference } from './planDive.testing';
import { PlanDiveInput } from './planDiveInput';
import { disclaimer, summaryText } from './planDiveResult';

describe('planDive', () => {
    const air18m20min: PlanDiveInput = { depth: 18, bottomTime: 20, tanks: [{ size: 15, startPressure: 200, o2: 21 }] };

    it('no deco air dive matches the app', () => {
        const result = planDive(air18m20min);
        const app = appReference(air18m20min);
        expect(result.noDecoDive).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.runtime).toBeCloseTo(app.runtime, 1);
        expect(result.tanks[0].endPressure).toBeCloseTo(app.endPressures[0], 1);
    });

    // values shown by the planner for its default dive, see planner.service.spec.ts "Successfully calculates 30m for 15 minutes"
    it('default dive of the app has the values shown by the app', () => {
        const result = planDive({
            depth: 30,
            bottomTime: 12,
            tanks: [{ size: 15, startPressure: 200, o2: 21 }],
            options: {
                ascentSpeed6m: 10, ascentSpeed50percTo6m: 10, ascentSpeed50perc: 10, descentSpeed: 20,
                problemSolvingDuration: 2, safetyStop: 'always'
            }
        });
        expect(result.noDecoLimit).toBe(13);
        expect(result.timeToSurface).toBe(8);
        expect(result.tanks[0].endPressure).toBe(117);
        expect(result.tanks[0].reservePressure).toBe(77);
        expect(result.otu).toBe(8);
        expect(result.cns).toBe(3);
    });

    it('nitrox deco dive with deco gas matches the app stops', () => {
        const input: PlanDiveInput = {
            depth: 40, bottomTime: 35,
            tanks: [{ size: 24, startPressure: 200, o2: 28 }, { size: 11, startPressure: 200, o2: 50 }]
        };
        const result = planDive(input);
        const app = appReference(input);
        expect(result.noDecoDive).toBe(false);
        expect(result.decoStops).toEqual(app.stops.map(s => ({ ...s, duration: round(s.duration) })));
        expect(result.decoStops.some(s => s.gas === 'EAN50')).toBe(true);
        expect(result.tanks[1].endPressure).toBeCloseTo(app.endPressures[1], 1);
    });

    it('trimix deco dive matches the app', () => {
        const input: PlanDiveInput = {
            depth: 60, bottomTime: 20,
            tanks: [{ size: 24, startPressure: 200, o2: 18, he: 45 }, { size: 11, startPressure: 200, o2: 50 }]
        };
        const result = planDive(input);
        const app = appReference(input);
        expect(result.errors).toEqual([]);
        expect(result.decoStops).toEqual(app.stops.map(s => ({ ...s, duration: round(s.duration) })));
        expect(result.runtime).toBeCloseTo(app.runtime, 1);
        expect(result.cns).toBe(Math.round(app.cns));
        expect(result.otu).toBe(Math.round(app.otu));
        expect(result.tanks[0].gas).toBe('Trimix 18/45');
    });

    it('uses app defaults for a new dive', () => {
        const defaults = planDive(air18m20min);
        const explicit = planDive({
            ...air18m20min,
            options: {
                gfLow: 40, gfHigh: 85, salinity: 'fresh', altitude: 0, safetyStop: 'auto',
                ascentSpeed50perc: 9, ascentSpeed50percTo6m: 3, ascentSpeed6m: 3, descentSpeed: 18
            },
            diver: { rmv: 20, stressRmv: 30 }
        });
        expect(defaults).toEqual(explicit);
    });

    it('salt water changes the plan', () => {
        const fresh = planDive({ ...air18m20min, depth: 40 });
        const salt = planDive({ ...air18m20min, depth: 40, options: { salinity: 'salt' } });
        expect(salt.noDecoLimit).toBeLessThan(fresh.noDecoLimit);
    });

    it('bottom time shorter than descent still plans the dive', () => {
        const result = planDive({ ...air18m20min, depth: 40, bottomTime: 1 });
        expect(result.errors).toEqual([]);
        expect(result.runtime).toBeGreaterThan(0);
    });

    it('reports tanks without reserve', () => {
        const result = planDive({ depth: 60, bottomTime: 40, tanks: [{ size: 10, startPressure: 200, o2: 21 }] });
        expect(result.tanks[0].hasReserve).toBe(false);
        expect(result.tanks[0].endPressure).toBeGreaterThanOrEqual(0);
    });

    // validated open circuit input can't produce an algorithm error, the profile errors come only from invalid plans
    it('returns algorithm errors instead of throwing', () => {
        vi.spyOn(PlanningTasks, 'calculateDecompression').mockReturnValue({
            diveId: 1,
            profile: {
                segments: [], finalTissues: [],
                errors: [{ timeStamp: 0, depth: 0, type: EventType.error, message: 'At least one bottom gas has to be defined.' }]
            }
        });
        const result = planDive(air18m20min);
        expect(result.errors).toEqual(['At least one bottom gas has to be defined.']);
        expect(result.tanks).toEqual([]);
        expect(result.disclaimer).toBe(disclaimer);
    });

    it('reports hypoxic gas event', () => {
        const result = planDive({ depth: 30, bottomTime: 10, tanks: [{ size: 15, startPressure: 200, o2: 10, he: 70 }] });
        expect(result.events.some(e => e.type === 'lowPpO2')).toBe(true);
        expect(result.events.find(e => e.type === 'lowPpO2')?.message).toContain('hypoxia');
    });

    it('carries the disclaimer', () => {
        expect(planDive(air18m20min).disclaimer).toBe(disclaimer);
    });

    it('summary text ends with the disclaimer', () => {
        const text = summaryText(planDive(air18m20min));
        expect(text).toContain('Runtime');
        expect(text.trimEnd().endsWith(disclaimer)).toBe(true);
    });

    const round = (value: number): number => Math.round(value * 10) / 10;
});
