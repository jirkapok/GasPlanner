import { DepthConverter } from './depth-converter';
import { StandardGases } from './Gases';
import { OtuCalculator } from './OtuCalculator';
import { Segment } from './Segments';
import { Time } from './Time';

describe('OtuCalculatorService', () => {
    const otuCalculator = new OtuCalculator(DepthConverter.simple());

    describe('Segments', () => {
        it('0 OTU for empty segments', () => {
            const emptyProfile: Segment[] = [];
            const otu = otuCalculator.calculateForProfile(emptyProfile);
            expect(otu).toBe(0);
        });

        const gas = StandardGases.ean32.copy();
        const profile: Segment[] = [
            new Segment(0, 36, gas, Time.oneMinute * 3),
            new Segment(36, 36, gas, Time.oneMinute * 22),
            new Segment(36, 0, gas, Time.oneMinute * 30)
        ];

        it('OTU counts as sum of all segments', () => {
            const otu = otuCalculator.calculateForProfile(profile);
            expect(otu).toBeCloseTo(64.8711617, 7);
        });

        it('Applies depth converter', () => {
            const calculator = new OtuCalculator(DepthConverter.forSaltWater());
            const otu = calculator.calculateForProfile(profile);
            expect(otu).toBeCloseTo(65.9177262, 7);
        });
    });

    describe('Flat - depth does not change', () => {
        it('0 OTU for 0 min at 0 ppO2', () => {
            const otu = otuCalculator.calculate(0, 0, 0, 0);
            expect(otu).toBe(0);
        });

        it('0 OTU for 22 min at .4 ppO2', () => {
            const otu = otuCalculator.calculate(22.0, .4, 0, 0);
            expect(otu).toBe(0);
        });

        it('0 OTU for 0 min at .4 ppO2', () => {
            const otu = otuCalculator.calculate(0, 1, 0, 0);
            expect(otu).toBe(0);
        });

        it('38.6762 OTU for 22min at 1.484 ppO2', () => {
            const otu = otuCalculator.calculate(1320, 1.484, 0, 0);
            expect(otu).toBe(38.676181761978775);
        });

        it('38.5818 OTU for 20 min at 1.6 ppO2', () => {
            const otu = otuCalculator.calculate(1200, 1.6, 0, 0);
            expect(otu).toBeCloseTo(38.5817773, 7);
        });

        it('28.9712 OTU for 20 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculate(1200, .32, 30, 36);
            expect(otu).toBeCloseTo(31.9046752, 7);
        });
    });

    describe('Difference - depth does change', () => {
        it('0 OTU for 20 min with 0 pO2 in 30 metres', () => {
            const otu = otuCalculator.calculate(1200, 0, 20, 30);
            expect(otu).toBe(0);
        });

        it('0 OTU for 0 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculate(0, .32, 20, 30);
            expect(otu).toBe(0);
        });

        it('28.9 OTU for 20 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculate(1320, .32, 36, 36);
            expect(otu).toBe(38.28272978563932);
        });

        it('2.4026 OTU for 3 min with EAN32 from 0 m to 36 m', () => {
            const otu = otuCalculator.calculate(180, .32, 0, 36);
            expect(otu).toBeCloseTo(2.4171302, 7);
        });

        it('24.0256 OTU for 30 min with EAN32 from 36 m to 0 m', () => {
            const otu = otuCalculator.calculate(1800, .32, 36, 0);
            expect(otu).toBeCloseTo(24.1713018, 7);
        });
    });
});
