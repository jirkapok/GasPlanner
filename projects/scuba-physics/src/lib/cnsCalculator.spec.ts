import { CnsCalculator } from './cnsCalculator';
import { DepthConverter } from './depth-converter';
import { StandardGases } from './Gases';
import { Segment } from './Segments';
import { Time } from './Time';

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

        // TODO fix test cases for ppO2 higher than 1.7
        fit('CNS for ppO2 above 1.7 for flat segment', () => {
            const cns = cnsCalculator.calculate(ean32pO2, 70, 70, 22);
            expect(cns).toBeCloseTo(123, 6);
        });

        it('CNS for ppO2 above 1.7 for ascent/descent segment', () => {
            const cns = cnsCalculator.calculate(ean32pO2, 70, 80, 22);
            expect(cns).toBeCloseTo(123, 6);
        });

        it('CNS counts as sum of all segments', () => {
            const cns = cnsCalculator.calculateForProfile(profile);
            expect(cns).toBeCloseTo(0.278264, 6);
        });

        it('Applies depth converter', () => {
            const calculator = new CnsCalculator(DepthConverter.forSaltWater());
            const cns = calculator.calculateForProfile(profile);
            expect(cns).toBeCloseTo(0.292927, 6);
        });
    });
});
