import { Time } from './Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gases, StandardGases } from './Gases';
import { Segments } from './Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from './pressure-converter';

describe('Buhlmann Algorithm - No decompression times', () => {
    it('Ndl at surface returns Infinity', () => {
        const depth = 0;
        const options = OptionExtensions.createOptions(1, 1, 1.6, 1.6, Salinity.fresh);
        const algorithm = new BuhlmannAlgorithm();
        const ndl = algorithm.noDecoLimit(depth, StandardGases.air, options);
        expect(ndl).toBe(Infinity);
    });

    it('8 m on air after 1440 minutes returns Infinity', () => {
        const depth = 6;
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.4, Salinity.fresh);

        const gases = new Gases();
        const air = StandardGases.air;
        gases.add(air);

        const segments = new Segments();
        segments.add(0, depth, air, Time.oneMinute * 1);
        segments.addFlat(depth, air, Time.oneMinute * 1440);

        const algorithm = new BuhlmannAlgorithm();
        const ndl = algorithm.noDecoLimitMultiLevel(segments, gases, options);
        expect(ndl).toBe(Infinity);
    });

    it('Calculates 6 m, even gas high ppO2 at 60 m', () => {
        const depth = 60;
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.4, Salinity.fresh);
        const algorithm = new BuhlmannAlgorithm();
        const ndl = algorithm.noDecoLimit(depth, StandardGases.air, options);
        expect(ndl).toBe(6);
    });

    describe('No decompression limits for multilevel dives', () => {
        const gases = new Gases();
        const air = StandardGases.air;
        gases.add(air);
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.4, Salinity.fresh);

        it('No decompression limit for multilevel dive equals simple dive Ndl', () => {
            const segments = new Segments();
            segments.add(0, 30, air, Time.oneMinute * 1.5);
            segments.addFlat(30, air, Time.oneMinute);

            const algorithm = new BuhlmannAlgorithm();
            const multiLevelNdl = algorithm.noDecoLimitMultiLevel(segments, gases, options);
            const ndl = algorithm.noDecoLimit(30, air, options);
            expect(ndl).toBe(multiLevelNdl);
        });

        it('Segments already reached NDL', () => {
            const segments = new Segments();
            segments.add(0, 40, air, Time.oneMinute * 2);
            segments.addFlat(40, air, Time.oneMinute * 5);
            segments.add(40, 20, air, Time.oneMinute * 2);
            segments.addFlat(20, air, Time.oneMinute * 40);

            const algorithm = new BuhlmannAlgorithm();
            const ndl = algorithm.noDecoLimitMultiLevel(segments, gases, options);
            expect(ndl).toBe(36);
        });

        it('Initial levels have remaining NDL', () => {
            const segments = new Segments();
            segments.add(0, 40, air, Time.oneMinute * 2);
            segments.addFlat(40, air, Time.oneMinute * 5);
            segments.add(40, 20, air, Time.oneMinute * 2);
            segments.addFlat(20, air, Time.oneMinute * 5);

            const algorithm = new BuhlmannAlgorithm();
            const ndl = algorithm.noDecoLimitMultiLevel(segments, gases, options);
            expect(ndl).toBe(36);
        });
    });

    describe('No decompression limits for air at depth', () => {
        const options = OptionExtensions.createOptions(1, 1, 1.6, 1.6, Salinity.fresh);

        const calculateNoDecompressionLimit = (testCases: number[][], salinity: Salinity) => {
            testCases.forEach(testCase => {
                const algorithm = new BuhlmannAlgorithm();
                const depth = testCase[0];
                options.salinity = salinity;
                const ndl = algorithm.noDecoLimit(depth, StandardGases.air, options);
                expect(ndl).toBe(testCase[1], `No deco limit for ${depth} failed`);
            });
        };

        it('Fresh water', () => {
            // 0: depth, 1: ndl
            const noDecoLimitTestCases = [
                [10, 337], // From which depth to start count with deco?
                [12, 161],
                [15, 85],
                [18, 57],
                [21, 40],
                [24, 28],
                [27, 21],
                [30, 16],
                [33, 13],
                [36, 11],
                [39, 9],
                [42, 9],
                [100, 5], // Where is the limit for no decompression depth?
            ];

            calculateNoDecompressionLimit(noDecoLimitTestCases, Salinity.fresh);
        });

        it('Fresh water with gradient factor 40/85', () => {
            const noDecoLimitTestCases = [
                [10, 206], // From which depth to start count with deco?
                [12, 111],
                [15, 65],
                [18, 41],
                [21, 28],
                [24, 20],
                [27, 15],
                [30, 12],
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
                [10, 289], // From which depth to start count with deco?
                [12, 148],
                [15, 80],
                [18, 53],
                [21, 37],
                [24, 26],
                [27, 20],
                [30, 15],
                [33, 13],
                [36, 10],
                [39, 8],
                [42, 8],
                [100, 4], // Where is the limit for no decompression depth?
            ];

            calculateNoDecompressionLimit(noDecoLimitTestCasesSalt, Salinity.salt);
        });
    });
});
