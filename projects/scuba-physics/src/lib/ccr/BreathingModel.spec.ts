import { OpenCircuitBreathing } from './BreathingModel';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Time } from '../physics/Time';

describe('Breathing model', () => {
    const depthConverter = DepthConverter.simple();

    describe('Open circuit', () => {
        const sut = new OpenCircuitBreathing(depthConverter);

        it('breathes the source gas', () => {
            const gas = StandardGases.ean32.copy();
            expect(sut.inspiredGas(gas, 30, false)).toBe(gas);
            expect(sut.inspiredGas(gas, 30, true)).toBe(gas);
        });

        it('ppO2 does not depend on ascent', () => {
            expect(sut.ppO2(StandardGases.ean32, 30, true)).toBeCloseTo(sut.ppO2(StandardGases.ean32, 30, false), 6);
        });

        it('ppO2 by depth', () => {
            expect(sut.ppO2(StandardGases.ean32, 30, false)).toBeCloseTo(1.28, 6);
        });

        it('consumes rmv at depth', () => {
            const segment = new Segment(30, 30, StandardGases.air, Time.oneMinute);
            const rmvPerSecond = Time.toMinutes(20);
            expect(sut.consumedLiters(segment, rmvPerSecond)).toBeCloseTo(80, 6);
        });

        it('allows gas switching and air breaks', () => {
            expect(sut.usesGasSwitching).toBeTrue();
            expect(sut.usesAirBreaks).toBeTrue();
        });
    });
});
