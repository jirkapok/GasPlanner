import { CnsCalculator } from './cnsCalculator';
import { DepthConverter } from '../physics/depth-converter';
import { ToxicityProfiles } from './OtuCalculator.spec';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { StandardGases } from '../gases/StandardGases';

describe('CNSCalculatorService', () => {
    const depthConverter = DepthConverter.simple();
    const cnsCalculator = new CnsCalculator(depthConverter);
    const ean32pO2 = 0.32;

    describe('Segments', () => {
        it('0 CNS for empty segments', () => {
            const emptyProfile: Segment[] = [];
            const cns = cnsCalculator.calculateForProfile(emptyProfile);
            expect(cns).toBeCloseTo(0, 6);
        });

        const gas = StandardGases.ean32.copy();
        const profile: Segment[] = [
            new Segment(0, 36.576, gas, Time.oneMinute * 3),
            new Segment(36.576, 36.576, gas, Time.oneMinute * 22),
            new Segment(36.576, 0, gas, Time.oneMinute * 30)
        ];

        it('0 CNS for ppO2 below 0.5 for flat segment', () => {
            const cns = cnsCalculator.calculate(ean32pO2, 1, 1, 22);
            expect(cns).toBeCloseTo(0, 6);
        });

        it('CNS for flat swim', () => {
            const cns = cnsCalculator.calculate(ean32pO2, 36.576, 36.576, 0);
            expect(cns).toBeCloseTo(0, 6);
        });

        it('0 CNS for ppO2 below 0.5 for ascent/descent segment', () => {
            const cns = cnsCalculator.calculate(ean32pO2, 1, 2, 22);
            expect(cns).toBeCloseTo(0, 6);
        });

        it('CNS for ppO2 above 1.7 for flat segment', () => {
            const cns = cnsCalculator.calculate(ean32pO2, 70, 70, 22);
            expect(cns).toBeCloseTo(9609.7649171, 6);
        });

        it('CNS for ppO2 above 1.7 for ascent/descent segment', () => {
            const cns = cnsCalculator.calculate(ean32pO2, 70, 80, 22);
            expect(cns).toBeCloseTo(46159.655563, 6);
        });

        it('CNS counts as sum of all segments', () => {
            const cns = cnsCalculator.calculateForProfile(profile);
            expect(cns).toBeCloseTo(26.8005612, 6);
        });

        it('Applies depth converter', () => {
            const calculator = new CnsCalculator(DepthConverter.forSaltWater());
            const cns = calculator.calculateForProfile(profile);
            expect(cns).toBeCloseTo(27.65157, 6);
        });
    });

    describe('Surface interval', () => {
        it('No residual for first dive', () => {
            const residual = CnsCalculator.residual(50, Number.POSITIVE_INFINITY);
            expect(residual).toBeCloseTo(0, 6);
        });

        it('No residual without previous CNS', () => {
            const residual = CnsCalculator.residual(0, Time.oneHour);
            expect(residual).toBeCloseTo(0, 6);
        });

        it('Full residual for zero surface interval', () => {
            const residual = CnsCalculator.residual(50, 0);
            expect(residual).toBeCloseTo(50, 6);
        });

        it('Half residual after 90 minutes', () => {
            const residual = CnsCalculator.residual(50, Time.oneMinute * 90);
            expect(residual).toBeCloseTo(25, 6);
        });

        it('Quarter residual after 180 minutes', () => {
            const residual = CnsCalculator.residual(50, Time.oneMinute * 180);
            expect(residual).toBeCloseTo(12.5, 6);
        });

        it('Almost no residual after 24 hours', () => {
            const residual = CnsCalculator.residual(100, Time.oneDay);
            // 16 half times
            expect(residual).toBeCloseTo(0.0015259, 6);
        });
    });

    describe('Repetitive dives', () => {
        const gas = StandardGases.ean32.copy();
        const profile: Segment[] = [
            new Segment(0, 36.576, gas, Time.oneMinute * 3),
            new Segment(36.576, 36.576, gas, Time.oneMinute * 22),
            new Segment(36.576, 0, gas, Time.oneMinute * 30)
        ];

        const diveChain = (count: number, surfaceInterval: number): number[] => {
            const results: number[] = [];
            let previousCns = 0;
            let interval = Number.POSITIVE_INFINITY;

            for (let index = 0; index < count; index++) {
                previousCns = cnsCalculator.calculateForRepetitiveDive(profile, previousCns, interval);
                results.push(previousCns);
                interval = surfaceInterval;
            }

            return results;
        };

        it('First dive ignores previous CNS', () => {
            const cns = cnsCalculator.calculateForRepetitiveDive(profile, 80, Number.POSITIVE_INFINITY);
            expect(cns).toBeCloseTo(26.8005612, 6);
        });

        it('Adds residual CNS of previous dive', () => {
            const cns = cnsCalculator.calculateForRepetitiveDive(profile, 40, Time.oneMinute * 90);
            expect(cns).toBeCloseTo(46.8005612, 6);
        });

        it('3 dives with 1 hour surface interval accumulate CNS', () => {
            const results = diveChain(3, Time.oneHour);
            expect(results[0]).toBeCloseTo(26.8005612, 6);
            expect(results[1]).toBeCloseTo(43.6838568, 6);
            expect(results[2]).toBeCloseTo(54.3196666, 6);
        });

        it('4 dives with 1 hour surface interval stay bellow limit', () => {
            const results = diveChain(4, Time.oneHour);
            expect(results[3]).toBeCloseTo(61.0198069, 6);
        });

        it('5 dives with 10 minutes surface interval exceed limit', () => {
            const results = diveChain(5, Time.oneMinute * 10);
            expect(results[3]).toBeCloseTo(95.8607624, 6);
            expect(results[4]).toBeCloseTo(115.5556170, 6);
        });
    });

    describe('Complex profiles', () => {
        const calculator = new CnsCalculator(DepthConverter.forFreshWater());

        it('Ean32 at 36 m - 25 %', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.ean32At36m);
            expect(otu).toBeCloseTo(25.298281, 7);
        });

        it('Oxygen at 6 m - 127 %%', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.oxygenAt6m);
            expect(otu).toBeCloseTo(126.9278835, 7);
        });

        it('Air at 40 m - 21 %', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.airAt40m);
            expect(otu).toBeCloseTo(6.938811, 7);
        });

        it('Trimix 18/45 at 50 m - 64 %', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.trimixAt50m);
            expect(otu).toBeCloseTo(41.0213067, 7);
        });
    });
});
