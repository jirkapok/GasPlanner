import { CnsCalculator } from './cnsCalculator';
import { DepthConverter } from '../depth-converter';
import { ToxicityProfiles } from './OtuCalculator.spec';
import { Segment } from '../depths/Segments';
import { Time } from '../Time';
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
