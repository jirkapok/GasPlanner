import { Time } from '../physics/Time';
import { Gases } from '../gases/Gases';
import { Segment, Segments } from '../depths/Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from '../physics/pressure-converter';
import { SafetyStop } from './Options';
import { StandardGases } from '../gases/StandardGases';
import { calculatePlanFor } from './BuhlmannAlgorithm.spec';

describe('Buhlmann Algorithm - Air breaks', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);

    beforeEach(() => {
        options.lastStopDepth = 6;
        options.safetyStop = SafetyStop.never;
        options.airBreaks.enabled = true;
        options.airBreaks.oxygenDuration = 20;
        options.airBreaks.bottomGasDuration = 5;
    });

    const calculateFinalSegments = (gases: Gases, source: Segments, segmentsCount: number): Segment[] => {
        const calculated = calculatePlanFor(gases, source, options);
        return calculated.slice(calculated.length - segmentsCount, calculated.length);
    };

    const calculatePlan75m = (bottomTimeMinutes: number, segmentsCount: number): Segment[] =>
        calculatePlan(75, bottomTimeMinutes, segmentsCount);

    const calculatePlan = (depth: number, bottomTimeMinutes: number, segmentsCount: number): Segment[] => {
        const gases = new Gases();
        gases.add(StandardGases.trimix1260);
        gases.add(StandardGases.trimix3525);
        gases.add(StandardGases.ean50);
        gases.add(StandardGases.oxygen);

        const segments = new Segments();
        segments.add(10, StandardGases.trimix3525, Time.oneMinute);
        segments.add(depth, StandardGases.trimix1260, Time.oneMinute * 5);
        segments.addFlat(StandardGases.trimix1260, Time.oneMinute * bottomTimeMinutes);

        const finalSegments = calculateFinalSegments(gases, segments, segmentsCount);
        return finalSegments;
    };

    it('No air break is added if oxygen time is less than max. O2 time', () => {
        const finalSegments = calculatePlan75m(10, 2);
        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 1049),
            new Segment(6,0, StandardGases.oxygen, 36)
        ];
        expect(finalSegments).toEqual(expected);
    });

    it('Adds air break for oxygen time longer than max. O2 time', () => {
        const finalSegments = calculatePlan75m(13, 4);
        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 1200),
            new Segment(6,6, StandardGases.trimix1260, 300),
            new Segment(6,6, StandardGases.oxygen, 124),
            new Segment(6,0, StandardGases.oxygen, 36)
        ];
        expect(finalSegments).toEqual(expected);
    });

    it('Applies air break duration settings', () => {
        options.airBreaks.oxygenDuration = 12;
        options.airBreaks.bottomGasDuration = 6;

        const finalSegments = calculatePlan75m(13, 4);
        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 720),
            new Segment(6,6, StandardGases.trimix1260, 360),
            new Segment(6,6, StandardGases.oxygen, 571),
            new Segment(6,0, StandardGases.oxygen, 36)
        ];
        expect(finalSegments).toEqual(expected);
    });

    it('Switches back to O2 after air break is finished', () => {
        const gases = new Gases();
        gases.add(StandardGases.ean32);
        gases.add(StandardGases.ean50);
        gases.add(StandardGases.oxygen);

        const segments = new Segments();
        segments.add(30, StandardGases.ean32, Time.oneMinute * 5);
        segments.addFlat(StandardGases.ean32, Time.oneMinute * 90);

        const finalSegments = calculateFinalSegments(gases, segments, 3);

        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 1200),
            new Segment(6,6, StandardGases.ean32, 237),
            new Segment(6,0, StandardGases.oxygen, 36)
        ];
        expect(finalSegments).toEqual(expected);
    });

    it('Adds multiple air breaks', () => {
        const finalSegments = calculatePlan75m(30, 6);
        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 1200),
            new Segment(6,6, StandardGases.trimix1260, 300),
            new Segment(6,6, StandardGases.oxygen, 1200),
            new Segment(6,6, StandardGases.trimix1260, 300),
            new Segment(6,6, StandardGases.oxygen, 883),
            new Segment(6,0, StandardGases.oxygen, 36)
        ];
        expect(finalSegments).toEqual(expected);
    });

    it('Safety stop is counted to max. O2 time', () => {
        options.safetyStop = SafetyStop.always;

        const finalSegments = calculatePlan75m(10.5, 3);
        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 1200),
            new Segment(6,6, StandardGases.trimix1260, 77),
            new Segment(6,0, StandardGases.oxygen, 36)
        ];

        expect(finalSegments).toEqual(expected);
    });

    it('Adds air breaks are added including last stop depth', () => {
        options.lastStopDepth = 3;

        const finalSegments = calculatePlan75m(20, 6);
        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 730),
            new Segment(6,3, StandardGases.oxygen, 18),
            new Segment(3,3, StandardGases.oxygen, 452),
            new Segment(3,3, StandardGases.trimix3525, 300),
            new Segment(3,3, StandardGases.oxygen, 763),
            new Segment(3,0, StandardGases.oxygen, 18)
        ];
        expect(finalSegments).toEqual(expected);
    });

    describe('NO breaks added', () => {
        it('Air breaks are disabled', () => {
            options.airBreaks.enabled = false;

            const finalSegments = calculatePlan75m(13, 3);
            const expected: Segment[] = [
                new Segment(9,6, StandardGases.ean50, 18),
                new Segment(6,6, StandardGases.oxygen, 1316),
                new Segment(6,0, StandardGases.oxygen, 36)
            ];
            expect(finalSegments).toEqual(expected);
        });

        it('Max. depth is less than oxygen max depth', () => {
            options.lastStopDepth = 3;
            const gases = new Gases();
            gases.add(StandardGases.ean50); // possible air break gas
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(6, StandardGases.oxygen, Time.oneMinute);
            segments.addFlat(StandardGases.oxygen, Time.oneMinute * 30);

            const finalSegments = calculateFinalSegments(gases, segments, 3);
            // need to compare whole array, because bottom depth is oxygen depth
            const current = [
                [ finalSegments[0].startDepth, finalSegments[0].endDepth, finalSegments[0].gas, finalSegments[0].duration ],
                [ finalSegments[1].startDepth, finalSegments[1].endDepth, finalSegments[1].gas, finalSegments[1].duration ],
                [ finalSegments[2].startDepth, finalSegments[2].endDepth, finalSegments[2].gas, finalSegments[2].duration ],
            ];

            const expected = [
                [ 0, 6, StandardGases.oxygen, 60 ],
                [ 6, 6, StandardGases.oxygen, 1800 ],
                [ 6, 0, StandardGases.oxygen, 36 ],
            ];
            expect(current).toEqual(expected);
        });
    });

    describe('Bottom gas not breathable', () => {
        it('No air break when not other gas is breathable at 6m', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1070); // hypoxic at 6 m
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(8, StandardGases.oxygen, Time.oneMinute); // broken ppO2
            segments.add(75, StandardGases.trimix1070, Time.oneMinute * 5);
            segments.addFlat(StandardGases.trimix1070, Time.oneMinute * 10);

            const finalSegments = calculateFinalSegments(gases, segments, 3);

            const expected: Segment[] = [
                new Segment(9,6, StandardGases.trimix1070, 18),
                new Segment(6,6, StandardGases.oxygen, 2490),
                new Segment(6,0, StandardGases.oxygen, 36)
            ];
            expect(finalSegments).toEqual(expected);
        });

        it('Air break is done on Ean50 as fallback gas at 6m', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1070);
            gases.add(StandardGases.ean50);
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(6, StandardGases.oxygen, Time.oneMinute);
            segments.add(75, StandardGases.trimix1070, Time.oneMinute * 5);
            segments.addFlat(StandardGases.trimix1070, Time.oneMinute * 15);

            const finalSegments = calculateFinalSegments(gases, segments, 4);

            const expected: Segment[] = [
                new Segment(6,6, StandardGases.oxygen, 1200),
                new Segment(6,6, StandardGases.ean50, 300),
                new Segment(6,6, StandardGases.oxygen, 794),
                new Segment(6,0, StandardGases.oxygen, 36)
            ];
            expect(finalSegments).toEqual(expected);
        });
    });
});
