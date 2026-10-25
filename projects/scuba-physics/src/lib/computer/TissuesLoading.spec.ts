import { AlgorithmParams } from '../algorithm/BuhlmannAlgorithmParameters';
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { CalculatedProfileStatistics } from '../algorithm/CalculatedProfile';
import { Options } from '../algorithm/Options';
import { OptionExtensions } from '../algorithm/Options.testing';
import { Tissues } from '../algorithm/Tissues';
import { Segments } from '../depths/Segments';
import { Gases } from '../gases/Gases';
import { StandardGases } from '../gases/StandardGases';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { TissuesLoading } from './TissuesLoading';

describe('TissuesLoading', () => {
    const air = StandardGases.air;
    const gfHigh = 0.85;
    const algorithm = new BuhlmannAlgorithm();

    const createOptions = (altitude: number): Options => {
        const options = OptionExtensions.createOptions(0.4, gfHigh, 1.4, 1.6, Salinity.fresh);
        options.altitude = altitude;
        return options;
    };

    /** Statistics of 30 m for 40 min dive on air, calculated the same way as by the planner */
    const statisticsFor = (options: Options): CalculatedProfileStatistics => {
        const gases = new Gases();
        gases.add(air);
        const segments = new Segments();
        segments.add(30, air, Time.oneMinute * 2);
        segments.addFlat(air, Time.oneMinute * 38);
        const dive = AlgorithmParams.forMultilevelDive(segments, gases, options, OptionExtensions.openCircuit(options));
        const profile = algorithm.decompression(dive).segments;
        const calculated = AlgorithmParams.forMultilevelDive(Segments.fromCollection(profile), gases, options, dive.breathing);
        return algorithm.decompressionStatistics(calculated);
    };

    const surfacePressureOf = (options: Options): number => new DepthConverterFactory(options).create().surfacePressure;

    const seaLevelOptions = createOptions(0);
    const surface = surfacePressureOf(seaLevelOptions);
    const statistics = statisticsFor(seaLevelOptions);
    // tissues history and ceilings share their index
    const loadingAt = (index: number, gradient = gfHigh): number =>
        TissuesLoading.percents(statistics.tissues[index], statistics.ceilings[index].depth, surface, gradient);

    it('Tissues saturated at surface are not loaded', () => {
        expect(TissuesLoading.percents(Tissues.createLoadedAt(0), 0, surface, gfHigh)).toEqual(0);
    });

    it('Ceiling below surface is fully loaded', () => {
        expect(TissuesLoading.percents(Tissues.createLoadedAt(0), 3, surface, gfHigh)).toEqual(100);
    });

    const expectReaches100WhenNoDecoLimitEnds = (altitude: number): void => {
        const altitudeOptions = createOptions(altitude);
        const altitudeSurface = surfacePressureOf(altitudeOptions);
        const altitudeStatistics = statisticsFor(altitudeOptions);
        const i = altitudeStatistics.ceilings.findIndex(c => c.depth > 0);
        const before = TissuesLoading.percents(altitudeStatistics.tissues[i - 1], 0, altitudeSurface, gfHigh);
        const reachedCeiling = altitudeStatistics.ceilings[i].depth;
        const reached = TissuesLoading.percents(altitudeStatistics.tissues[i], reachedCeiling, altitudeSurface, gfHigh);

        expect(i).toBeGreaterThan(0);
        expect(before).toBeCloseTo(100, 0);
        expect(before).toBeLessThan(100);
        expect(reached).toEqual(100);
    };

    it('Reaches 100 when no decompression limit ends', () => {
        expectReaches100WhenNoDecoLimitEnds(0);
    });

    it('Reaches 100 when no decompression limit ends at altitude', () => {
        expectReaches100WhenNoDecoLimitEnds(2000);
    });

    it('Loading grows at the bottom', () => {
        expect(loadingAt(Time.oneMinute * 10)).toBeLessThan(loadingAt(Time.oneMinute * 20));
    });

    it('Lower gradient factor high means higher loading', () => {
        expect(loadingAt(Time.oneMinute * 10, 0.7)).toBeGreaterThan(loadingAt(Time.oneMinute * 10, gfHigh));
    });
});
