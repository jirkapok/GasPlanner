import { Time } from './Time';
import { Gases } from './Gases';
import { Segment, Segments } from './Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from './pressure-converter';
import { SafetyStop } from './Options';
import { StandardGases } from './StandardGases';
import { calculatePlanFor } from './BuhlmannAlgorithm.spec';

xdescribe('Buhlmann Algorithm - Air breaks', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);

    beforeEach(() => {
        options.lastStopDepth = 6;
        options.safetyStop = SafetyStop.never;
        // default air break settings 20/5
    });

    const calculateFinalSegments = (gases: Gases, source: Segments, segmentsCount: number): Segment[] => {
        const calculated = calculatePlanFor(gases, source, options);
        return calculated.slice(calculated.length - segmentsCount, calculated.length);
    };

    const calculatePlan75m = (bottomTimeMinutes: number, segmentsCount: number): Segment[] => {
        return calculatePlan(75, bottomTimeMinutes, segmentsCount);
    };

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

    xit('Counts with safety stop to max. O2 time', () => {
        options.safetyStop = SafetyStop.always;

        const finalSegments = calculatePlan75m(15, 2);
        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 1724),
            new Segment(6,0, StandardGases.oxygen, 36)
        ];
        expect(finalSegments).toEqual(expected);
    });

    xit('Adds air break only in 6m, not at last stop depth', () => {
        options.lastStopDepth = 3;

        const finalSegments = calculatePlan75m(30, 4);
        const expected: Segment[] = [
            new Segment(6,6, StandardGases.oxygen, 1168),
            new Segment(6,3, StandardGases.oxygen, 18),
            new Segment(3,3, StandardGases.oxygen, 2099),
            new Segment(3,0, StandardGases.oxygen, 18)
        ];
        expect(finalSegments).toEqual(expected);
    });

    describe('Bottom gas not breathable', () => {
        it('No air break when not other gas is breath able at 6m', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1260);
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(6, StandardGases.oxygen, Time.oneMinute);
            segments.add(75, StandardGases.trimix1260, Time.oneMinute * 5);
            segments.addFlat(StandardGases.trimix1260, Time.oneMinute * 5);

            const finalSegments = calculateFinalSegments(gases, segments, 2);

            const expected: Segment[] = [
                new Segment(6,6, StandardGases.oxygen, 907),
                new Segment(6,0, StandardGases.oxygen, 36)
            ];
            expect(finalSegments).toEqual(expected);
        });

        it('Air break is done on Ean50 as fallback gas at 6m', () => {
            const gases = new Gases();
            gases.add(StandardGases.trimix1260);
            gases.add(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(6, StandardGases.oxygen, Time.oneMinute);
            segments.add(75, StandardGases.trimix1260, Time.oneMinute * 5);
            segments.addFlat(StandardGases.trimix1260, Time.oneMinute * 5);

            const finalSegments = calculateFinalSegments(gases, segments, 2);

            const expected: Segment[] = [
                new Segment(6,6, StandardGases.oxygen, 907),
                new Segment(6,0, StandardGases.oxygen, 36)
            ];
            expect(finalSegments).toEqual(expected);
        });
    });

    // behavior notes:
    // * safety stop is also counted to the air break
    // TODO add warning if unable to switch to air break if back gas not breathable at 6m
    // TODO add test for small depths without deco, but with oxygen - shouldn't add air break
});
