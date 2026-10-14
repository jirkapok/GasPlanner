import { CnsCalculator } from './cnsCalculator';
import { OtuCalculator } from './OtuCalculator';
import { CnsDailyCalculator } from './cnsDailyCalculator';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Time } from '../physics/Time';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';

describe('Toxicity - Breathing model', () => {
    const depthConverter = DepthConverter.simple();
    const openCircuit = new OpenCircuitBreathing(depthConverter);
    // EAN32: bottom ppO2 1.28 at 30 m, ascent average 15 m => ppO2 0.8
    const profile = [
        new Segment(30, 30, StandardGases.ean32, Time.oneMinute * 20),
        new Segment(30, 0, StandardGases.ean32, Time.oneMinute * 10)
    ];

    it('CNS uses breathed ppO2', () => {
        const sut = new CnsCalculator(depthConverter, openCircuit);
        const expected = sut.calculateByPpO2(1.28, Time.oneMinute * 20) + sut.calculateByPpO2(0.8, Time.oneMinute * 10);
        expect(sut.calculateForProfile(profile, 1)).toBeCloseTo(expected, 6);
    });

    it('CNS of open circuit does not depend on the ascent start', () => {
        const sut = new CnsCalculator(depthConverter, openCircuit);
        expect(sut.calculateForProfile(profile, 1)).toBeCloseTo(sut.calculateForProfile(profile), 10);
    });

    it('CNS by ppO2 equals CNS by fO2 for open circuit', () => {
        const sut = new CnsCalculator(depthConverter, openCircuit);
        expect(sut.calculateByPpO2(1.28, 600)).toBeCloseTo(sut.calculate(0.32, 30, 30, 600), 6);
    });

    it('OTU uses breathed ppO2', () => {
        const sut = new OtuCalculator(depthConverter, openCircuit);
        const expected = sut.calculateByPpO2(Time.oneMinute * 20, 1.28, 1.28) + sut.calculateByPpO2(Time.oneMinute * 10, 1.28, 0.32);
        expect(sut.calculateForProfile(profile, 1)).toBeCloseTo(expected, 6);
    });

    it('OTU by ppO2 equals OTU by fO2 for open circuit', () => {
        const sut = new OtuCalculator(depthConverter, openCircuit);
        expect(sut.calculateByPpO2(600, 1.28, 0.64)).toBeCloseTo(sut.calculate(600, 0.32, 30, 10), 6);
    });

    it('Daily CNS uses breathed ppO2', () => {
        const sut = new CnsDailyCalculator(depthConverter, openCircuit);
        const exposures = sut.exposuresForProfile(profile, 1);
        expect(exposures[0].cns).toBeCloseTo(sut.calculateByPpO2(1.28, Time.oneMinute * 20), 6);
        expect(exposures[1].cns).toBeCloseTo(sut.calculateByPpO2(0.8, Time.oneMinute * 10), 6);
    });

    it('Daily CNS of open circuit does not depend on the ascent start', () => {
        const sut = new CnsDailyCalculator(depthConverter, openCircuit);
        expect(sut.exposuresForProfile(profile, 1)).toEqual(sut.exposuresForProfile(profile));
    });
});
