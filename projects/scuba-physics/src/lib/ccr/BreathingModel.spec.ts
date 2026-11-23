import { BailoutBreathing, BreathingModel, OpenCircuitBreathing } from './BreathingModel';
import { PscrBreathing } from './PscrBreathing';
import { MccrBreathing } from './MccrBreathing';
import { Tank } from '../consumption/Tanks';
import { EventType } from '../algorithm/CalculatedProfile';
import { CircuitType, RebreatherOptions } from './RebreatherOptions';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Time } from '../physics/Time';

describe('Breathing model', () => {
    const depthConverter = DepthConverter.simple();

    describe('Open circuit', () => {
        // used by interface, as consumers do, because open circuit ignores depth and ascent for the gas
        const sut: BreathingModel = new OpenCircuitBreathing(depthConverter);

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
            expect(sut.usesGasSwitching).toBe(true);
            expect(sut.usesAirBreaks).toBe(true);
        });

        it('has no oxygen source', () => {
            const segment = new Segment(30, 30, StandardGases.air, Time.oneMinute);
            expect(sut.oxygenTank).toBeUndefined();
            expect(sut.oxygenLiters(segment)).toBeCloseTo(0, 6);
        });

        it('is always valid', () => {
            expect(sut.validate()).toEqual([]);
        });
    });

    describe('Bailout', () => {
        const loop = new PscrBreathing(new RebreatherOptions(CircuitType.pscr), 20, depthConverter);
        const sut: BreathingModel = new BailoutBreathing(loop, depthConverter);

        it('breathes loop gas before ascent', () => {
            const loopGas = loop.inspiredGas(StandardGases.ean32, 30);
            expect(sut.inspiredGas(StandardGases.ean32, 30, false).fO2).toBeCloseTo(loopGas.fO2, 6);
        });

        it('breathes the tank gas during ascent', () => {
            expect(sut.inspiredGas(StandardGases.ean32, 30, true)).toBe(StandardGases.ean32);
        });

        it('ppO2 of the loop before ascent and of the tank gas during ascent', () => {
            expect(sut.ppO2(StandardGases.ean32, 30, false)).toBeCloseTo(loop.ppO2(StandardGases.ean32, 30), 6);
            expect(sut.ppO2(StandardGases.ean32, 30, true)).toBeCloseTo(1.28, 6);
        });

        it('uses bailout gas switching and air breaks', () => {
            expect(sut.usesGasSwitching).toBe(true);
            expect(sut.usesAirBreaks).toBe(true);
        });

        it('consumes as open circuit', () => {
            const segment = new Segment(30, 30, StandardGases.air, Time.oneMinute);
            const rmvPerSecond = Time.toMinutes(20);
            expect(sut.consumedLiters(segment, rmvPerSecond)).toBeCloseTo(80, 6);
        });

        it('has no oxygen source, because ascent is open circuit', () => {
            const segment = new Segment(30, 30, StandardGases.air, Time.oneMinute);
            expect(sut.oxygenTank).toBeUndefined();
            expect(sut.oxygenLiters(segment)).toBeCloseTo(0, 6);
        });

        it('validates the loop model', () => {
            const tanks = [new Tank(12, 200, 21), new Tank(11, 200, 50)];
            const mccr = new MccrBreathing(new RebreatherOptions(CircuitType.mccr), tanks, depthConverter);
            const errors = new BailoutBreathing(mccr, depthConverter).validate();
            expect(errors.length).toBe(1);
            expect(errors[0].type).toBe(EventType.error);
        });
    });
});
