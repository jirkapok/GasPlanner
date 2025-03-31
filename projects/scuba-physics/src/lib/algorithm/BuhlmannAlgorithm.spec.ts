import { Time } from '../physics/Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gas, Gases } from '../gases/Gases';
import { Segment, Segments } from '../depths/Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from '../physics/pressure-converter';
import { Options, SafetyStop } from './Options';
import { StandardGases } from '../gases/StandardGases';
import { AlgorithmParams } from "./BuhlmannAlgorithmParameters";

function concatenatePlan(decoPlan: Segment[]): string {
    let planText = '';
    decoPlan.forEach(segment => {
        planText += `${segment.startDepth},${segment.endDepth},${segment.duration}; `;
    });

    return planText.trim();
}

export function calculatePlanFor(gases: Gases, source: Segments, options: Options): Segment[] {
    const algorithm = new BuhlmannAlgorithm();
    const parameters = AlgorithmParams.forMultilevelDive(source, gases, options);
    const decoPlan = algorithm.decompression(parameters);
    return decoPlan.segments;
}

describe('Buhlmann Algorithm - Plan', () => {
    // There is no such profile, where deco is increased even during ascent,
    // because the tissues pressure never reaches so close to the ambient pressure.
    // Every ascent immediately starts decompression.

    // gradientFactorLow = 0.4, gradientFactorHigh=0.85, deco ppO2 = 1.6, and max END allowed: 30 meters.
    // we don't need to change the gradient factors, because its application is already confirmed by the ascent times and no deco times
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    options.safetyStop = SafetyStop.always;

    beforeEach(() => {
        options.safetyStop = SafetyStop.always;
        options.salinity = Salinity.salt;
        options.roundStopsToMinutes = true;
        options.roundRuntimesToMinutes = false;
        options.decoStopDistance = 3;
        options.altitude = 0;
    });

    const calculatePlan = (gases: Gases, source: Segments): string => {
        const decoPlan = calculatePlanFor(gases, source, options);
        const planText = concatenatePlan(decoPlan);
        return planText;
    };

    describe('Environment - 40m for 10 minutes on air with small deco', () => {
        const gases = new Gases();
        gases.add(StandardGases.air);
        let segments: Segments;

        beforeEach(() => {
            options.roundStopsToMinutes = false;
            options.safetyStop = SafetyStop.never;
            options.salinity = Salinity.salt;
            options.altitude = 0;
            segments = new Segments();
            segments.add(40, StandardGases.air, 2 * Time.oneMinute);
            segments.addFlat(StandardGases.air, 8 * Time.oneMinute);
        });

        it('Salt water at sea level is applied', () => {
            const planText = calculatePlan(gases, segments);
            const expectedPlan = '0,40,120; 40,40,480; 40,3,222; 3,3,46; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        describe('Salinity', () => {
            it('Fresh water is applied', () => {
                options.salinity = Salinity.fresh;
                const planText = calculatePlan(gases, segments);
                const expectedPlan = '0,40,120; 40,40,480; 40,3,222; 3,3,22; 3,0,18;';
                expect(planText).toBe(expectedPlan);
            });

            it('Brackish water is applied', () => {
                options.salinity = Salinity.brackish;
                const planText = calculatePlan(gases, segments);
                const expectedPlan = '0,40,120; 40,40,480; 40,3,222; 3,3,38; 3,0,18;';
                expect(planText).toBe(expectedPlan);
            });
        });

        describe('Altitude', () => {
            it('1000 m.a.s.l is applied', () => {
                options.altitude = 1000;
                const planText = calculatePlan(gases, segments);
                const expectedPlan = '0,40,120; 40,40,480; 40,6,204; 6,6,22; 6,3,18; 3,3,68; 3,0,18;';
                expect(planText).toBe(expectedPlan);
            });
        });
    });

    it('Stop distance is applied', () => {
        options.decoStopDistance = 5;
        const gases: Gases = new Gases();
        gases.add(StandardGases.air);
        const segments = new Segments();
        segments.add(30, StandardGases.air, 3 * Time.oneMinute);
        segments.addFlat(StandardGases.air, 30 * Time.oneMinute);
        const planText = calculatePlan(gases, segments);
        const expectedPlan = '0,30,180; 30,30,1800; 30,10,120; 10,10,300; 10,5,30; 5,5,240; 5,3,12; 3,3,840; 3,0,18;';
        expect(planText).toBe(expectedPlan);
    });

    describe('Safety Stop', () => {
        describe('Last stop depth', () => {
            it('5m for 30 minutes, last stop depth at 6 m - no safety stop', () => {
                options.lastStopDepth = 6;
                const planText = createPlan5meters30minutes();
                options.lastStopDepth = 3;
                const expectedPlan = '0,5,15; 5,5,1785; 5,0,30;';
                expect(planText).toBe(expectedPlan);
            });

            it('5m for 30 minutes, last stop depth at 5 m - added safety stop', () => {
                options.lastStopDepth = 5;
                const planText = createPlan5meters30minutes();
                options.lastStopDepth = 3;
                const expectedPlan = '0,5,15; 5,5,1785; 5,5,180; 5,0,30;';
                expect(planText).toBe(expectedPlan);
            });
        });

        it('5m for 30 minutes using ean32 - no safety stop', () => {
            options.safetyStop = SafetyStop.never;
            const planText = createPlan5meters30minutes();
            const expectedPlan = '0,5,15; 5,5,1785; 5,0,30;';
            expect(planText).toBe(expectedPlan);
        });

        it('5m for 30 minutes using ean32 - no safety stop automatically', () => {
            options.safetyStop = SafetyStop.auto;
            const planText = createPlan5meters30minutes();
            const expectedPlan = '0,5,15; 5,5,1785; 5,0,30;';
            expect(planText).toBe(expectedPlan);
        });

        it('5m for 30 minutes using ean32 - added safety stop', () => {
            options.safetyStop = SafetyStop.always;
            const planText = createPlan5meters30minutes();
            const expectedPlan = '0,5,15; 5,5,1785; 5,3,12; 3,3,180; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        function createPlan5meters30minutes(): string {
            const gases: Gases = new Gases();
            gases.add(StandardGases.ean32);
            const segments = new Segments();
            segments.add(5, StandardGases.ean32, 15);
            segments.addFlat(StandardGases.ean32, 29.75 * Time.oneMinute);
            const planText = calculatePlan(gases, segments);
            return planText;
        }

        it('10m for 40 minutes using air with safety stop at 3m - no deco, safety stop added', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);

            const segments = new Segments();
            segments.add(10, StandardGases.air, 30);
            segments.addFlat(StandardGases.air, 39.5 * Time.oneMinute);

            options.safetyStop = SafetyStop.always;
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,10,30; 10,10,2370; 10,3,42; 3,3,180; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('30m no deco - no safety stop', () => {
            options.safetyStop = SafetyStop.never;
            const planText = createPlan30m12minutes();
            const expectedPlan = '0,30,120; 30,30,600; 30,0,180;';
            expect(planText).toBe(expectedPlan);
        });

        it('30m no deco - add safety stop', () => {
            options.safetyStop = SafetyStop.always;
            const planText = createPlan30m12minutes();
            const expectedPlan = '0,30,120; 30,30,600; 30,3,162; 3,3,180; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('30m no deco - automatically added safety stop', () => {
            options.safetyStop = SafetyStop.auto;
            const planText = createPlan30m12minutes();
            const expectedPlan = '0,30,120; 30,30,600; 30,3,162; 3,3,180; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        function createPlan30m12minutes(): string {
            const gases: Gases = new Gases();
            gases.add(StandardGases.ean32);

            const segments = new Segments();
            segments.add(30, StandardGases.ean32, 2 * Time.oneMinute);
            segments.addFlat(StandardGases.ean32, 10 * Time.oneMinute);

            const planText = calculatePlan(gases, segments);
            return planText;
        }
    });

    it('User already included ascent adds no segment', () => {
        const gases = new Gases();
        gases.add(StandardGases.air);

        const segments = new Segments();
        segments.add(10, StandardGases.air, Time.oneMinute);
        segments.addFlat(StandardGases.air, 10 * Time.oneMinute);
        segments.add(0, StandardGases.air, Time.oneMinute);

        const planText = calculatePlan(gases, segments);

        const expectedPlan = '0,10,60; 10,10,600; 10,0,60;';
        expect(planText).toBe(expectedPlan);
    });

    it('30m for 25 minutes using air', () => {
        const gases = new Gases();
        gases.add(StandardGases.air);

        const segments = new Segments();
        segments.add(30, StandardGases.air, 1.5 * Time.oneMinute);
        segments.addFlat(StandardGases.air, 23.5 * Time.oneMinute);

        const planText = calculatePlan(gases, segments);

        const expectedPlan = '0,30,90; 30,30,1410; 30,9,126; 9,9,60; ' +
            '9,6,18; 6,6,180; 6,3,18; 3,3,420; 3,0,18;';
        expect(planText).toBe(expectedPlan);
    });

    it('40m for 30 minutes using air and ean50', () => {
        const gases = new Gases();
        gases.add(StandardGases.air);
        gases.add(StandardGases.ean50);

        const segments = new Segments();
        segments.add(40, StandardGases.air, 2 * Time.oneMinute);
        segments.addFlat(StandardGases.air, 28 * Time.oneMinute);

        const planText = calculatePlan(gases, segments);

        const expectedPlan = '0,40,120; 40,40,1680; 40,21,114; 21,21,60; 21,15,36; 15,15,60; 15,12,18; ' +
            '12,12,120; 12,9,18; 9,9,180; 9,6,18; 6,6,360; 6,3,18; 3,3,900; 3,0,18;';
        expect(planText).toBe(expectedPlan);
    });

    describe ('Round runtimes to minutes', () => {
        beforeEach(() => {
            options.roundStopsToMinutes = false;
            options.roundRuntimesToMinutes = true;
        });

        it('40m for 30 minutes using air, ean50, oxygen rounding for runtime', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);
            gases.add(StandardGases.ean50);
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(40, StandardGases.air, 2 * Time.oneMinute);
            segments.addFlat(StandardGases.air, 28 * Time.oneMinute);
            options.roundRuntimesToMinutes = true;
            options.roundStopsToMinutes = false;
            const planText = calculatePlan(gases, segments);

            // gas switch at 21 meters is not rounded in runtime
            const expectedPlan = '0,40,120; 40,40,1680; 40,21,114; 21,21,60; 21,15,36; 15,15,30; 15,12,18; ' +
                '12,12,162; 12,9,18; 9,9,222; 9,6,18; 6,6,222; 6,3,18; 3,3,582; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('50m for 25 minutes using 21/35 and 50% nitrox', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix2135);
            gases.add(StandardGases.ean50);

            const segments = new Segments();
            segments.add(50, StandardGases.trimix2135, 2.5 * Time.oneMinute);
            segments.addFlat(StandardGases.trimix2135, 22.5 * Time.oneMinute);

            options.roundStopsToMinutes = true;
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,50,150; 50,50,1350; 50,21,174; 21,21,60; 21,18,18; ' +
                '18,18,48; 18,15,18; 15,15,102; 15,12,18; 12,12,102; 12,9,18; ' +
                '9,9,222; 9,6,18; 6,6,402; 6,3,18; 3,3,942; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });
    });

    describe('Trimix, deco stops rounding', () => {
        it('50m for 25 minutes using 21/35 and 50% nitrox - rounding', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix2135);
            gases.add(StandardGases.ean50);

            const segments = new Segments();
            segments.add(50, StandardGases.trimix2135, 2.5 * Time.oneMinute);
            segments.addFlat(StandardGases.trimix2135, 22.5 * Time.oneMinute);

            options.roundStopsToMinutes = true;
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,50,150; 50,50,1350; 50,21,174; 21,21,60; 21,18,18; ' +
                '18,18,60; 18,15,18; 15,15,60; 15,12,18; 12,12,120; 12,9,18; ' +
                '9,9,240; 9,6,18; 6,6,360; 6,3,18; 3,3,960; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('50m for 30 minutes using 21/35, 50% nitrox and oxygen - no rounding', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix2135);
            gases.add(StandardGases.ean50);
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(50, StandardGases.trimix2135, 2.5 * Time.oneMinute);
            segments.addFlat(StandardGases.trimix2135, 22.5 * Time.oneMinute);

            options.roundStopsToMinutes = false;
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,50,150; 50,50,1350; 50,21,174; 21,21,60; 21,18,18; ' +
                '18,18,7; 18,15,18; 15,15,84; 15,12,18; 12,12,132; 12,9,18; ' +
                '9,9,221; 9,6,18; 6,6,267; 6,3,18; 3,3,697; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });
    });

    describe('Gas switches - 30m for 10 minutes', () => {
        const createSegments = (): Segments => {
            const segments = new Segments();
            segments.add(30, StandardGases.air, 1.5 * Time.oneMinute);
            segments.addFlat(StandardGases.air, 8.5 * Time.oneMinute);
            return segments;
        };

        it('using air, ean50 and oxygen - gas switch in 21m and 6m, even no deco', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);
            gases.add(StandardGases.ean50);
            gases.add(StandardGases.oxygen);

            const segments = createSegments();
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,30,90; 30,30,510; 30,21,54; 21,21,60; 21,6,90; 6,6,60; 6,3,18; 3,3,180; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('using air and ean32 - gas switch in 30m just before ascent', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);
            gases.add(StandardGases.ean32);

            const segments = createSegments();
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,30,90; 30,30,510; 30,30,60; 30,3,162; 3,3,180; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('using air and two ean50`s - only one gas switch is added', () => {
            const gases = new Gases();
            gases.add(StandardGases.air);
            gases.add(StandardGases.ean50);
            const ean50b = new Gas(0.5, 0);
            gases.add(ean50b);

            const segments = createSegments();
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,30,90; 30,30,510; 30,21,54; 21,21,60; 21,3,108; 3,3,180; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });
    });

    describe('Trimix hypoxic', () => {
        it('12/60 is used up to the surface, if no better gas is found', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1260);

            const segments = new Segments();
            segments.add(75, StandardGases.trimix1260, 5 * Time.oneMinute);
            segments.addFlat(StandardGases.trimix1260, 5 * Time.oneMinute);

            options.roundStopsToMinutes = true;
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,75,300; 75,75,300; 75,27,288; 27,27,60; 27,24,18; 24,24,60; 24,21,18; ' +
                '21,21,60; 21,18,18; 18,18,180; 18,15,18; 15,15,180; 15,12,18; 12,12,300; ' +
                '12,9,18; 9,9,540; 9,6,18; 6,6,1200; 6,3,18; 3,3,3240; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('75 m deep dive with multiple deco gases', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1260);
            gases.add(StandardGases.trimix3525);
            gases.add(new Gas(0.5, 0.2));
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(10, StandardGases.trimix3525, Time.oneMinute);
            segments.add(75, StandardGases.trimix1260, 5 * Time.oneMinute);
            segments.addFlat(StandardGases.trimix1260, 5 * Time.oneMinute);

            options.roundStopsToMinutes = true;
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,10,60; 10,75,300; 75,75,300; 75,36,234; 36,36,60; 36,21,90; 21,21,60; ' +
                '21,18,18; 18,18,60; 18,15,18; 15,15,60; 15,12,18; 12,12,120; ' +
                '12,9,18; 9,9,180; 9,6,18; 6,6,240; 6,3,18; 3,3,600; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

    });
});
