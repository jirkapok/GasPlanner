import { AverageDepth } from './AverageDepth';
import { Segment } from './Segments';
import { StandardGases } from '../gases/StandardGases';

describe('Average depth', () => {
    describe('Add depth', () => {
        it('Is zero before first depth', () => {
            expect(new AverageDepth().average).toEqual(0);
        });

        it('First depth is the start of the dive', () => {
            const sut = new AverageDepth();
            expect(sut.add(10)).toEqual(10);
            expect(sut.average).toEqual(10);
        });

        it('Same depth keeps the average', () => {
            const sut = new AverageDepth();
            sut.add(20);
            sut.add(20);
            expect(sut.add(20)).toEqual(20);
        });

        it('Each second counts as average of previous and current depth', () => {
            const sut = new AverageDepth();
            sut.add(0);
            // seconds: (0 + 2) / 2 = 1, (2 + 4) / 2 = 3
            sut.add(2);
            expect(sut.add(4)).toBeCloseTo(2, 6);
        });

        it('Returns the average after the added depth', () => {
            const sut = new AverageDepth();
            sut.add(0);
            const added = sut.add(10);
            expect(added).toEqual(sut.average);
            expect(added).toBeCloseTo(5, 6);
        });
    });

    describe('For profile', () => {
        // descent to 10 m in 60 s, then 60 s at 10 m
        const descentAndBottom = [
            new Segment(0, 10, StandardGases.air, 60),
            new Segment(10, 10, StandardGases.air, 60)
        ];

        it('No segments = no values', () => {
            expect(new AverageDepth().forProfile([])).toEqual([]);
        });

        it('One value for every second including start and end', () => {
            expect(new AverageDepth().forProfile(descentAndBottom).length).toEqual(121);
        });

        it('Starts with the depth at the start of the dive', () => {
            expect(new AverageDepth().forProfile(descentAndBottom)[0]).toEqual(0);
        });

        it('Is time weighted average from start of the dive to the second', () => {
            const averages = new AverageDepth().forProfile(descentAndBottom);
            // descent 0 -> 10 m in 60 s: area 300 m*s / 60 s
            expect(averages[60]).toBeCloseTo(5, 6);
            // + 60 s at 10 m: (300 + 600) / 120 s
            expect(averages[120]).toBeCloseTo(7.5, 6);
        });

        it('One segment ends at its middle depth', () => {
            const averages = new AverageDepth().forProfile([new Segment(10, 30, StandardGases.air, 60)]);
            expect(averages[averages.length - 1]).toBeCloseTo(20, 6);
        });

        it('Ends at the average depth of the whole profile', () => {
            const segments = [
                new Segment(0, 40, StandardGases.air, 60),
                new Segment(40, 40, StandardGases.air, 120),
                new Segment(40, 0, StandardGases.air, 60)
            ];
            const averages = new AverageDepth().forProfile(segments);
            expect(averages[averages.length - 1]).toBeCloseTo(30, 6);
        });

        it('Average is the average of the whole profile', () => {
            const sut = new AverageDepth();
            sut.forProfile(descentAndBottom);
            expect(sut.average).toBeCloseTo(7.5, 6);
        });

        it('Average of empty profile = 0 m', () => {
            const sut = new AverageDepth();
            sut.forProfile([]);
            expect(sut.average).toBe(0);
        });

        it('Zero duration segment', () => {
            const segments = [
                new Segment(40, 40, StandardGases.air, 0),
                new Segment(40, 40, StandardGases.air, 60)
            ];
            const averages = new AverageDepth().forProfile(segments);
            expect(averages[0]).toEqual(40);
            expect(averages.every(a => !Number.isNaN(a))).toBeTrue();
            expect(averages[60]).toBeCloseTo(40, 6);
        });

        it('Fractional duration ends at last whole second', () => {
            const averages = new AverageDepth().forProfile([new Segment(0, 10, StandardGases.air, 90.5)]);
            expect(averages.length).toEqual(91);
            // depth at 90 s is 10 * 90 / 90.5, average of linear descent is half of it
            expect(averages[90]).toBeCloseTo(10 * 90 / 90.5 / 2, 6);
        });
    });
});
