import { DepthConverter } from '../physics/depth-converter';
import { OtuCalculator } from './OtuCalculator';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { StandardGases } from '../gases/StandardGases';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';
import { ToxicityProfiles } from './OtuCalculator.testing';

describe('OtuCalculatorService', () => {
    const depthConverter = DepthConverter.simple();
    const openCircuit = new OpenCircuitBreathing(depthConverter);
    const otuCalculator = new OtuCalculator(depthConverter, openCircuit);

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
            const saltWater = DepthConverter.forSaltWater();
            const calculator = new OtuCalculator(saltWater, new OpenCircuitBreathing(saltWater));
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

    describe('Complex profiles', () => {
        const freshWater = DepthConverter.forFreshWater();
        const calculator = new OtuCalculator(freshWater, new OpenCircuitBreathing(freshWater));

        it('Ean32 at 36 m - 64 OTU', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.ean32At36m);
            expect(otu).toBeCloseTo(63.8879499, 7);
        });

        it('Oxygen at 6 m - 115 OTU', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.oxygenAt6m);
            expect(otu).toBeCloseTo(114.9995884, 7);
        });

        it('Air at 40 m - 21 OTU', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.airAt40m);
            expect(otu).toBeCloseTo(20.8817664, 7);
        });

        it('Trimix 18/45 at 50 m - 62 OTU', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.trimixAt50m);
            expect(otu).toBeCloseTo(62.4140139, 7);
        });
    });

    describe('Breathing model', () => {
        // EAN32: ppO2 1.28 at 30 m, 0.32 at surface
        const ean32Profile = [
            new Segment(30, 30, StandardGases.ean32, Time.oneMinute * 20),
            new Segment(30, 0, StandardGases.ean32, Time.oneMinute * 10)
        ];

        it('uses breathed ppO2', () => {
            const expected = otuCalculator.calculateByPpO2(Time.oneMinute * 20, 1.28, 1.28) +
                otuCalculator.calculateByPpO2(Time.oneMinute * 10, 1.28, 0.32);
            expect(otuCalculator.calculateForProfile(ean32Profile, 1)).toBeCloseTo(expected, 6);
        });

        it('by ppO2 equals by fO2 for open circuit', () => {
            expect(otuCalculator.calculateByPpO2(600, 1.28, 0.64)).toBeCloseTo(otuCalculator.calculate(600, 0.32, 30, 10), 6);
        });
    });
});
