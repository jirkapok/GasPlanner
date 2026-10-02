import { PscrBreathing } from './PscrBreathing';
import { BreathingModel } from './BreathingModel';
import { CircuitType, RebreatherOptions } from './RebreatherOptions';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Time } from '../physics/Time';

describe('pSCR breathing', () => {
    const depthConverter = DepthConverter.simple();
    const options = new RebreatherOptions(CircuitType.pscr);
    options.injectionRatio = 8;
    const sut: BreathingModel = new PscrBreathing(options, 20, depthConverter);

    it('breathes leaner loop gas than the supply', () => {
        const loop = sut.inspiredGas(StandardGases.ean32, 30, false);
        expect(loop.fO2).toBeCloseTo(0.244444, 5);
    });

    it('ppO2 of the loop gas', () => {
        expect(sut.ppO2(StandardGases.ean32, 30, false)).toBeCloseTo(0.977778, 5);
    });

    it('consumes supply rate by injection ratio', () => {
        const segment = new Segment(30, 30, StandardGases.ean32, Time.oneMinute);
        const rmvPerSecond = Time.toMinutes(20);
        expect(sut.consumedLiters(segment, rmvPerSecond)).toBeCloseTo(10, 6);
    });

    it('switches gas but has no air breaks', () => {
        expect(sut.usesGasSwitching).toBeTrue();
        expect(sut.usesAirBreaks).toBeFalse();
    });
});
