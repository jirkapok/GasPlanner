import { Ceiling, HighestDensity, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { DiveResults } from '../diveresults';
import { UnitConversion } from '../UnitConversion';
import { WayPoint } from '../wayPoint';
import { ComputerProfile } from './computerProfile';

describe('ComputerProfile', () => {
    const tissues = ProfileTissues.createAtSurface(0);

    /** Ceilings are sampled every second starting at 1 s, the same way the algorithm does it */
    const ceilingsFrom = (depths: number[]): Ceiling[] => depths.map((depth, index) => new Ceiling(index + 1, depth));

    const createResults = (segments: Segment[], ceilings: Ceiling[] = [], noDecoTime = 0,
        units = new UnitConversion()): DiveResults => {
        const results = new DiveResults();
        let offset = 0;
        const wayPoints = segments.map((segment) => {
            const wayPoint = WayPoint.fromSegment(units, segment, offset);
            offset += segment.duration;
            return wayPoint;
        });
        results.updateProfile(wayPoints, tissues);
        results.updateDiveInfo(noDecoTime, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), ceilings, [], []);
        return results;
    };

    const air = StandardGases.air;
    // descent to 10 m in 60 s, then 60 s at 10 m
    const simpleDive = [
        new Segment(0, 10, air, 60),
        new Segment(10, 10, air, 60)
    ];

    it('Empty profile results in no points', () => {
        const data = ComputerProfile.calculate(createResults([]));
        expect(data.profile).toEqual([]);
        expect(data.events).toEqual([]);
    });

    it('Empty data has no points', () => {
        expect(ComputerProfile.empty()).toEqual({ profile: [], events: [] });
    });

    it('Creates point for every second including start and end', () => {
        const data = ComputerProfile.calculate(createResults(simpleDive));
        expect(data.profile.length).toEqual(121);
        expect(data.profile.map(p => p.runTime)).toEqual(Array.from({ length: 121 }, (_, i) => i));
    });

    it('Interpolates depth within way point', () => {
        const profile = ComputerProfile.calculate(createResults(simpleDive)).profile;
        expect(profile[0].depth).toBeCloseTo(0, 6);
        expect(profile[30].depth).toBeCloseTo(5, 6);
        expect(profile[60].depth).toBeCloseTo(10, 6);
        expect(profile[90].depth).toBeCloseTo(10, 6);
    });

    it('Depth in meters with imperial units', () => {
        const units = new UnitConversion();
        units.imperialUnits = true;
        const profile = ComputerProfile.calculate(createResults(simpleDive, [], 0, units)).profile;
        expect(profile[90].depth).toBeCloseTo(10, 6);
    });

    it('Fractional duration ends at last whole second', () => {
        const profile = ComputerProfile.calculate(createResults([new Segment(0, 10, air, 90.5)])).profile;
        expect(profile.length).toEqual(91);
        expect(profile[90].runTime).toEqual(90);
        expect(profile[90].depth).toBeCloseTo(9.945, 3);
    });

    it('Ceiling taken from latest ceiling sample at the same or earlier time', () => {
        const ceilings = ceilingsFrom([0, 0, 3, 3.5]);
        const profile = ComputerProfile.calculate(createResults(simpleDive, ceilings)).profile;
        expect(profile[0].ceiling).toEqual(0);
        expect(profile[2].ceiling).toEqual(0);
        expect(profile[3].ceiling).toEqual(3);
        expect(profile[4].ceiling).toEqual(3.5);
        // no more samples, last known ceiling is kept
        expect(profile[100].ceiling).toEqual(3.5);
    });

    describe('Depth statistics', () => {
        // 0 -> 30 m in 60 s, 60 s at 30 m, ascent 30 -> 10 m in 60 s
        const diveWithAscent = [
            new Segment(0, 30, air, 60),
            new Segment(30, 30, air, 60),
            new Segment(30, 10, air, 60)
        ];

        it('Maximum depth is current maximum depth at the moment', () => {
            const profile = ComputerProfile.calculate(createResults(diveWithAscent)).profile;
            expect(profile[0].maxDepth).toBeCloseTo(0, 6);
            expect(profile[30].maxDepth).toBeCloseTo(15, 6);
            expect(profile[150].depth).toBeCloseTo(20, 6);
            expect(profile[150].maxDepth).toBeCloseTo(30, 6);
        });

        it('Average depth is zero at start', () => {
            const profile = ComputerProfile.calculate(createResults(simpleDive)).profile;
            expect(profile[0].averageDepth).toEqual(0);
        });

        it('Average depth is current time weighted average depth at the moment', () => {
            const profile = ComputerProfile.calculate(createResults(simpleDive)).profile;
            // descent 0 -> 10 m in 60 s: area 300 m*s / 60 s
            expect(profile[60].averageDepth).toBeCloseTo(5, 6);
            // + 60 s at 10 m: (300 + 600) / 120 s
            expect(profile[120].averageDepth).toBeCloseTo(7.5, 6);
        });
    });
});
