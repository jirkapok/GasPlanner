import { Time } from '../physics/Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gases } from '../gases/Gases';
import { Segments } from '../depths/Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from '../physics/pressure-converter';
import { StandardGases } from '../gases/StandardGases';
import { AlgorithmParams } from './BuhlmannAlgorithmParameters';

describe('Buhlmann Algorithm - No decompression limits for every second', () => {
    const options = OptionExtensions.createOptions(1, 1, 1.4, 1.4, Salinity.fresh);
    const algorithm = new BuhlmannAlgorithm();
    const air = StandardGases.air;

    const paramsFor = (fill: (segments: Segments) => void): AlgorithmParams => {
        const gases = new Gases();
        gases.add(air);
        const segments = new Segments();
        fill(segments);
        return AlgorithmParams.forMultilevelDive(segments, gases, options, OptionExtensions.openCircuit(options));
    };

    // descent 0 -> 30 m in 120 s, bottom at 30 m 120 - 720 s, then calculated ascent
    const squareDive = paramsFor(s => {
        s.add(30, air, Time.oneMinute * 2);
        s.addFlat(air, Time.oneMinute * 10);
    });

    it('Returns value for every second of the calculated profile', () => {
        const profile = algorithm.decompression(squareDive).segments;
        const seconds = profile.reduce((sum, s) => sum + Math.ceil(s.duration), 0);
        expect(algorithm.noDecoLimits(squareDive).length).toEqual(seconds + 1);
    });

    it('Infinity at surface', () => {
        const limits = algorithm.noDecoLimits(squareDive);
        expect(limits[0]).toBe(Infinity);
        expect(limits[limits.length - 1]).toBe(Infinity);
    });

    it('Counts down while staying at the same depth', () => {
        const limits = algorithm.noDecoLimits(squareDive);
        expect(limits[200]).toEqual(limits[150] - 50);
    });

    it('Prediction at bottom corresponds to no deco limit of the dive', () => {
        const ndlMinutes = algorithm.noDecoLimit(paramsFor(s => s.add(30, air, Time.oneMinute * 2)));
        const limits = algorithm.noDecoLimits(squareDive);
        // noDecoLimit is floored to minutes and counted from the dive start
        const ndlFromStart = (120 + limits[120]) / Time.oneMinute;
        expect(ndlFromStart).toBeGreaterThanOrEqual(ndlMinutes);
        expect(ndlFromStart).toBeLessThan(ndlMinutes + 2);
    });

    it('New prediction when depth changes', () => {
        // 30 m 120 - 720 s, ascent to 15 m 720 - 810 s, 15 m from 810 s
        const multiLevel = paramsFor(s => {
            s.add(30, air, Time.oneMinute * 2);
            s.addFlat(air, Time.oneMinute * 10);
            s.add(15, air, 90);
            s.addFlat(air, Time.oneMinute * 20);
        });
        const limits = algorithm.noDecoLimits(multiLevel);
        expect(limits[815]).toBeGreaterThan(limits[719] + 95);
    });

    it('Zero while ceiling is not at surface and new prediction after deco cleared', () => {
        const decoDive = paramsFor(s => {
            s.add(40, air, 160);
            s.addFlat(air, Time.oneMinute * 25);
        });
        const limits = algorithm.noDecoLimits(decoDive);
        const firstZero = limits.indexOf(0);
        const clearedAt = limits.findIndex((limit, index) => index > firstZero && limit > 0);
        expect(firstZero).toBeGreaterThan(0);
        expect(clearedAt).toBeGreaterThan(firstZero);
        // still under water, before the final moment at surface
        expect(clearedAt).toBeLessThan(limits.length - 1);
    });

    it('Shallow depth exceeding 1000 minutes is Infinity', () => {
        const shallow = paramsFor(s => {
            s.add(5, air, Time.oneMinute);
            s.addFlat(air, Time.oneMinute * 10);
        });
        const limits = algorithm.noDecoLimits(shallow);
        expect(limits[300]).toBe(Infinity);
    });

    it('Sequence yields the same limits one by one', () => {
        const sequence = algorithm.noDecoLimitsSequence(squareDive);
        const first = sequence.next();
        expect(first.done).toBeFalse();
        expect([first.value, ...sequence]).toEqual(algorithm.noDecoLimits(squareDive));
    });

    it('Empty when profile can\'t be calculated', () => {
        // gas used by the segment isn't in the gases
        const gases = new Gases();
        gases.add(air);
        const segments = new Segments();
        segments.add(30, StandardGases.ean50, Time.oneMinute * 2);
        const invalid = AlgorithmParams.forMultilevelDive(segments, gases, options, OptionExtensions.openCircuit(options));
        expect(algorithm.noDecoLimits(invalid)).toEqual([]);
    });

    describe('Of calculated profile', () => {
        // 40 m for 25 min, decompression dive
        const decoDive = paramsFor(s => {
            s.add(40, air, 160);
            s.addFlat(air, Time.oneMinute * 25);
        });

        it('No decompression limits of profile equal no decompression limits of the plan', () => {
            const profile = algorithm.decompression(decoDive).segments;
            expect(Array.from(algorithm.noDecoLimitsOfProfile(decoDive, profile))).toEqual(algorithm.noDecoLimits(decoDive));
        });

        it('Empty profile has no limits', () => {
            expect(Array.from(algorithm.noDecoLimitsOfProfile(decoDive, []))).toEqual([]);
        });
    });
});
