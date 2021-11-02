import { Time } from './Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gas, Gases, StandardGases } from './Gases';
import { Segment, Segments } from './Segments';
import { Options } from './Options';

describe('Buhlmann Algorithm', () => {
    describe('No decompression times', () => {
        it('Calculate air No decompression limit at surface', () => {
            const depth = 0;
            const options = new Options(1, 1, 1.6, 1.6, 30, true);
            const algorithm = new BuhlmannAlgorithm();
            const ndl = algorithm.noDecoLimit(depth, StandardGases.air, options);
            expect(ndl).toBe(Infinity);
        });

        it('Calculates 6 m, even gas high ppO2 at 60 m', () => {
            const depth = 60;
            const options = new Options(1, 1, 1.4, 1.4, 30, true);
            const algorithm = new BuhlmannAlgorithm();
            const ndl = algorithm.noDecoLimit(depth, StandardGases.air, options);
            expect(ndl).toBe(6);
        });

        describe('No decompression limits for multilevel dives', () => {
            const gases = new Gases();
            const air = StandardGases.air;
            gases.addBottomGas(air);
            const options = new Options(1, 1, 1.4, 1.4, 30, true);

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
            const options = new Options(1, 1, 1.6, 1.6, 30, true);

            const calculateNoDecompressionLimit = (testCases: number[][], isFreshWater: boolean) => {
                testCases.forEach(testCase => {
                    const algorithm = new BuhlmannAlgorithm();
                    const depth = testCase[0];
                    options.isFreshWater = isFreshWater;
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

                calculateNoDecompressionLimit(noDecoLimitTestCases, true);
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
                calculateNoDecompressionLimit(noDecoLimitTestCases, true);
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

                calculateNoDecompressionLimit(noDecoLimitTestCasesSalt, false);
            });
        });
    });

    describe('Calculates Plan', () => {
        // gradientFactorLow = 0.4, gradientFactorHigh=0.85, deco ppO2 = 1.6, and max END allowed: 30 meters.
        // we don't need to change the gradient factors, because its application is already confirmed by the ascent times and no deco times
        const options = new Options(0.4, 0.85, 1.4, 1.6, 30, false, true);

        beforeEach(() => {
            options.addSafetyStop = true;
            options.isFreshWater = false;
            options.roundStopsToMinutes = true;
            options.altitude = 0;
        });

        const calculatePlan = (gases: Gases, source: Segments): string => {
            const algorithm = new BuhlmannAlgorithm();
            const decoPlan = algorithm.calculateDecompression(options, gases, source);
            const planText = concatenatePlan(decoPlan.segments);
            return planText;
        };

        const concatenatePlan = (decoPlan: Segment[]): string => {
            let planText = '';
            decoPlan.forEach(segment => {
                planText += `${segment.startDepth},${segment.endDepth},${segment.duration}; `;
            });

            return planText.trim();
        };

        describe('Environment 40m for 10 minutes on air with small deco', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);
            let segments: Segments;

            beforeEach(() => {
                options.roundStopsToMinutes = false;
                options.addSafetyStop = false;
                options.isFreshWater = false;
                options.altitude = 0;
                segments = new Segments();
                segments.add(0, 40, StandardGases.air, 2 * Time.oneMinute);
                segments.addFlat(40, StandardGases.air, 8 * Time.oneMinute);
            });

            it('Salinity is applied', () => {
                options.isFreshWater = true;
                const planText = calculatePlan(gases, segments);

                const expectedPlan = '0,40,120; 40,40,480; 40,3,222; 3,3,58; 3,0,18;';
                expect(planText).toBe(expectedPlan);
            });

            it('Altitude is applied', () => {
                options.altitude = 1000;
                const planText = calculatePlan(gases, segments);

                const expectedPlan = '0,40,120; 40,40,480; 40,9,186; 9,9,8; 9,6,18; 6,6,50; 6,3,18; 3,3,78; 3,0,18;';
                expect(planText).toBe(expectedPlan);
            });
        });

        it('5m for 30 minutes using ean32 - no safety stop', () => {
            const gases: Gases = new Gases();
            gases.addBottomGas(StandardGases.ean32);

            const segments = new Segments();
            segments.add(0, 5, StandardGases.ean32, 15);
            segments.addFlat(5, StandardGases.ean32, 29.75 * Time.oneMinute);

            options.addSafetyStop = false;
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,5,15; 5,5,1785; 5,0,30;';
            expect(planText).toBe(expectedPlan);
        });

        it('10m for 40 minutes using air with safety stop at 3m - no deco, safety stop added', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 10, StandardGases.air, 30);
            segments.addFlat(10, StandardGases.air, 39.5 * Time.oneMinute);

            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,10,30; 10,10,2370; 10,3,42; 3,3,180; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('User already included ascent adds no segment', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 10, StandardGases.air, 1 * Time.oneMinute);
            segments.addFlat(10, StandardGases.air, 10 * Time.oneMinute);
            segments.add(10, 0, StandardGases.air, 1 * Time.oneMinute);

            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,10,60; 10,10,600; 10,0,60;';
            expect(planText).toBe(expectedPlan);
        });

        it('30m for 25 minutes using air', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);

            const segments = new Segments();
            segments.add(0, 30, StandardGases.air, 1.5 * Time.oneMinute);
            segments.addFlat(30, StandardGases.air, 23.5 * Time.oneMinute);

            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,30,90; 30,30,1410; 30,12,108; 12,12,60; 12,9,18; ' +
                '9,9,60; 9,6,18; 6,6,180; 6,3,18; 3,3,540; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('40m for 30 minutes using air and ean50', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.air);
            gases.addBottomGas(StandardGases.ean50);

            const segments = new Segments();
            segments.add(0, 40, StandardGases.air, 2 * Time.oneMinute);
            segments.addFlat(40, StandardGases.air, 28 * Time.oneMinute);

            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,40,120; 40,40,1680; 40,21,114; 21,21,60; 21,15,36; 15,15,60; 15,12,18; ' +
                '12,12,180; 12,9,18; 9,9,180; 9,6,18; 6,6,360; 6,3,18; 3,3,900; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('50m for 25 minutes using 21/35 and 50% nitrox', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.trimix2135);
            gases.addDecoGas(StandardGases.ean50);

            const segments = new Segments();
            segments.add(0, 50, StandardGases.trimix2135, 2.5 * Time.oneMinute);
            segments.addFlat(50, StandardGases.trimix2135, 22.5 * Time.oneMinute);

            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,50,150; 50,50,1350; 50,21,174; 21,21,60; 21,18,18; ' +
                '18,18,60; 18,15,18; 15,15,120; 15,12,18; 12,12,120; 12,9,18; ' +
                '9,9,240; 9,6,18; 6,6,360; 6,3,18; 3,3,960; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        it('50m for 30 minutes using 21/35, 50% nitrox and oxygen - no rounding', () => {
            const gases = new Gases();
            gases.addBottomGas(StandardGases.trimix2135);
            gases.addDecoGas(StandardGases.ean50);
            gases.addDecoGas(StandardGases.oxygen);

            const segments = new Segments();
            segments.add(0, 50, StandardGases.trimix2135, 2.5 * Time.oneMinute);
            segments.addFlat(50, StandardGases.trimix2135, 22.5 * Time.oneMinute);

            options.roundStopsToMinutes = false;
            const planText = calculatePlan(gases, segments);

            const expectedPlan = '0,50,150; 50,50,1350; 50,21,174; 21,21,60; 21,18,18; ' +
                '18,18,35; 18,15,18; 15,15,86; 15,12,18; 12,12,137; 12,9,18; ' +
                '9,9,229; 9,6,18; 6,6,274; 6,3,18; 3,3,697; 3,0,18;';
            expect(planText).toBe(expectedPlan);
        });

        describe('30m for 10 minutes', () => {
            const createSegments = (): Segments => {
                const segments = new Segments();
                segments.add(0, 30, StandardGases.air, 1.5 * Time.oneMinute);
                segments.addFlat(30, StandardGases.air, 8.5 * Time.oneMinute);
                return segments;
            };

            it('using air, ean50 and oxygen - gas switch in 21m and 6m, even no deco', () => {
                const gases = new Gases();
                gases.addBottomGas(StandardGases.air);
                gases.addDecoGas(StandardGases.ean50);
                gases.addDecoGas(StandardGases.oxygen);

                const segments = createSegments();
                const planText = calculatePlan(gases, segments);

                const expectedPlan = '0,30,90; 30,30,510; 30,21,54; 21,21,60; 21,6,90; 6,6,60; 6,3,18; 3,3,180; 3,0,18;';
                expect(planText).toBe(expectedPlan);
            });

            it('using air and ean32 - gas switch in 30m just before ascent', () => {
                const gases = new Gases();
                gases.addBottomGas(StandardGases.air);
                gases.addDecoGas(StandardGases.ean32);

                const segments = createSegments();
                const planText = calculatePlan(gases, segments);

                const expectedPlan = '0,30,90; 30,30,510; 30,30,60; 30,3,162; 3,3,180; 3,0,18;';
                expect(planText).toBe(expectedPlan);
            });

            it('using air and two ean50`s - only one gas switch is added', () => {
                const gases = new Gases();
                gases.addBottomGas(StandardGases.air);
                gases.addDecoGas(StandardGases.ean50);
                const ean50b = new Gas(0.5, 0);
                gases.addDecoGas(ean50b);

                const segments = createSegments();
                const planText = calculatePlan(gases, segments);

                const expectedPlan = '0,30,90; 30,30,510; 30,21,54; 21,21,60; 21,3,108; 3,3,180; 3,0,18;';
                expect(planText).toBe(expectedPlan);
            });
        });

        // TODO add algorithm test cases:
        // A: where deco is increased even during ascent <= do we have profile for this use case?

        // B: Safety stop is correctly applied at expected depth
        // C: 2m, 60min, gases: .21; fresh, 0masl. No safety stop and direct ascent to surface.
        // D: 3m, 60min, gases: .21; fresh, 0masl. No safety stop and direct ascent to surface.

        // E: Gases: 18/45, oxygen to 80m for 20min, option air breaks = true; there should be breaks at 6m back to trimix
    });
});
