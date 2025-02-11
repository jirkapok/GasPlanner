import { Time } from './Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gases } from './gases/Gases';
import { Segments } from './Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from './pressure-converter';
import { StandardGases } from './gases/StandardGases';
import { AlgorithmParams } from "./BuhlmannAlgorithmParameters";

describe('Buhlmann Algorithm - No decompression times', () => {
    it('Ndl at surface returns Infinity', () => {
        const depth = 0;
        const options = OptionExtensions.createOptions(1, 1, 1.6, 1.6, Salinity.fresh);
        const algorithm = new BuhlmannAlgorithm();
        const simpleDive = AlgorithmParams.forSimpleDive(depth, StandardGases.air, options);
        const ndl = algorithm.noDecoLimit(simpleDive);
        expect(ndl).toBe(Infinity);
    });

    it('8 m on air after 1440 minutes returns Infinity', () => {
        const depth = 6;
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.4, Salinity.fresh);

        const gases = new Gases();
        const air = StandardGases.air;
        gases.add(air);

        const segments = new Segments();
        segments.add(depth, air, Time.oneMinute * 1);
        segments.addFlat(air, Time.oneMinute * 1440);

        const algorithm = new BuhlmannAlgorithm();
        const multilevelDive = AlgorithmParams.forMultilevelDive(segments, gases, options);
        const ndl = algorithm.noDecoLimit(multilevelDive);
        expect(ndl).toBe(Infinity);
    });

    it('Calculates 6 m, even gas high ppO2 at 60 m', () => {
        const depth = 60;
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.4, Salinity.fresh);
        const algorithm = new BuhlmannAlgorithm();
        const simpleDive = AlgorithmParams.forSimpleDive(depth, StandardGases.air, options);
        const ndl = algorithm.noDecoLimit(simpleDive);
        expect(ndl).toBe(6);
    });

    describe('No decompression limits for multilevel dives', () => {
        const gases = new Gases();
        const air = StandardGases.air;
        gases.add(air);
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.4, Salinity.fresh);

        it('No decompression limit for multilevel dive equals simple dive Ndl', () => {
            const segments = new Segments();
            segments.add(30, air, Time.oneMinute * 1.5);
            segments.addFlat(air, Time.oneMinute);

            const algorithm = new BuhlmannAlgorithm();
            const multilevelDive = AlgorithmParams.forMultilevelDive(segments, gases, options);
            const multiLevelNdl = algorithm.noDecoLimit(multilevelDive);
            const simpleDive = AlgorithmParams.forMultilevelDive(segments, gases, options);
            const ndl = algorithm.noDecoLimit(simpleDive);
            expect(ndl).toBe(multiLevelNdl);
        });

        it('Segments already reached NDL', () => {
            const segments = new Segments();
            segments.add(40, air, Time.oneMinute * 2);
            segments.addFlat(air, Time.oneMinute * 5);
            segments.add(20, air, Time.oneMinute * 2);
            segments.addFlat(air, Time.oneMinute * 40);

            const algorithm = new BuhlmannAlgorithm();
            const parameters = AlgorithmParams.forMultilevelDive(segments, gases, options);
            const ndl = algorithm.noDecoLimit(parameters);
            expect(ndl).toBe(39);
        });

        it('Initial levels have remaining NDL', () => {
            const segments = new Segments();
            segments.add(40, air, Time.oneMinute * 2);
            segments.addFlat(air, Time.oneMinute * 5);
            segments.add(20, air, Time.oneMinute * 2);
            segments.addFlat(air, Time.oneMinute * 5);

            const algorithm = new BuhlmannAlgorithm();
            const parameters = AlgorithmParams.forMultilevelDive(segments, gases, options);
            const ndl = algorithm.noDecoLimit(parameters);
            expect(ndl).toBe(39);
        });
    });

    describe('No decompression limits for air at depth', () => {
        const options = OptionExtensions.createOptions(1, 1, 1.6, 1.6, Salinity.fresh);

        const calculateNoDecompressionLimit = (testCases: number[][], salinity: Salinity) => {
            testCases.forEach(testCase => {
                const algorithm = new BuhlmannAlgorithm();
                const depth = testCase[0];
                options.salinity = salinity;
                const parameters = AlgorithmParams.forSimpleDive(depth, StandardGases.air, options);
                const ndl = algorithm.noDecoLimit(parameters);
                expect(ndl).toBe(testCase[1], `No deco limit for ${depth} failed`);
            });
        };

        it('Fresh water', () => {
            // 0: depth, 1: ndl
            const noDecoLimitTestCases = [
                [10, 473], // From which depth to start count with deco?
                [12, 195],
                [15, 94],
                [18, 61],
                [21, 43],
                [24, 30],
                [27, 23],
                [30, 17],
                [33, 14],
                [36, 11],
                [39, 9],
                [42, 9],
                [100, 5], // Where is the limit for no decompression depth?
            ];

            calculateNoDecompressionLimit(noDecoLimitTestCases, Salinity.fresh);
        });

        it('Fresh water with gradient factor 40/85', () => {
            const noDecoLimitTestCases = [
                [10, 268], // From which depth to start count with deco?
                [12, 134],
                [15, 72],
                [18, 45],
                [21, 30],
                [24, 21],
                [27, 16],
                [30, 13],
                [33, 10],
                [36, 8],
                [39, 7],
                [42, 7],
                [100, 4], // Where is the limit for no decompression depth?
            ];

            options.gfLow = .4;
            options.gfHigh = .85;
            calculateNoDecompressionLimit(noDecoLimitTestCases, Salinity.fresh);
            options.gfLow = 1;
            options.gfHigh = 1;
        });

        it('Salt water', () => {
            const noDecoLimitTestCasesSalt = [
                [10, 403], // From which depth to start count with deco?
                [12, 173],
                [15, 87],
                [18, 57],
                [21, 40],
                [24, 28],
                [27, 21],
                [30, 16],
                [33, 13],
                [36, 10],
                [39, 9],
                [42, 8],
                [100, 5], // Where is the limit for no decompression depth?
            ];

            calculateNoDecompressionLimit(noDecoLimitTestCasesSalt, Salinity.salt);
        });
    });
});
