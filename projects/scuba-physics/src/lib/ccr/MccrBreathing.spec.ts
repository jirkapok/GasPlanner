import { MccrBreathing } from './MccrBreathing';
import { BreathingModel } from './BreathingModel';
import { CircuitType, RebreatherOptions } from './RebreatherOptions';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Tank } from '../consumption/Tanks';
import { Time } from '../physics/Time';
import { EventType } from '../algorithm/CalculatedProfile';

describe('mCCR breathing', () => {
    const depthConverter = DepthConverter.forSaltWater();
    const diluent = new Tank(12, 200, 21);
    const oxygen = new Tank(3, 200, 100);
    const bailout = new Tank(11, 200, 50);

    const createOptions = (): RebreatherOptions => {
        const rebreather = new RebreatherOptions(CircuitType.mccr, 1.0, 6);
        rebreather.setpoint = 1.3;
        rebreather.o2Flow = 0.8;
        return rebreather;
    };

    const options = createOptions();
    const sut = new MccrBreathing(options, [diluent, oxygen, bailout], depthConverter);

    describe('Loop gas', () => {
        it('holds the setpoint', () => {
            expect(sut.ppO2(StandardGases.air, 30)).toBeCloseTo(1.3, 6);
        });

        it('keeps the diluent inert gases ratio', () => {
            const loop = sut.inspiredGas(StandardGases.trimix2135, 30);
            const diluentRatio = StandardGases.trimix2135.fHe / StandardGases.trimix2135.fN2;
            expect(loop.fHe / loop.fN2).toBeCloseTo(diluentRatio, 6);
        });

        it('breathes pure oxygen when setpoint is higher than ambient pressure', () => {
            const ambient = depthConverter.toBar(2);
            expect(sut.ppO2(StandardGases.air, 2)).toBeCloseTo(ambient, 6);
            expect(sut.inspiredGas(StandardGases.air, 2).fO2).toBeCloseTo(1, 6);
        });

        it('breathes diluent ppO2 when diluent is richer than setpoint', () => {
            const diluentPpO2 = StandardGases.air.fO2 * depthConverter.toBar(100);
            expect(sut.ppO2(StandardGases.air, 100)).toBeCloseTo(diluentPpO2, 6);
        });

        it('holds the same setpoint during ascent', () => {
            const model: BreathingModel = sut;
            expect(model.ppO2(StandardGases.air, 30, true)).toBeCloseTo(model.ppO2(StandardGases.air, 30, false), 6);
        });

        it('doesn\'t switch gases nor applies air breaks', () => {
            expect(sut.usesGasSwitching).toBeFalse();
            expect(sut.usesAirBreaks).toBeFalse();
        });
    });

    describe('Diluent consumption', () => {
        it('fills the loop during descent', () => {
            const descent = new Segment(0, 30, StandardGases.air, Time.oneMinute * 2);
            const expected = 6 * (depthConverter.toBar(30) - depthConverter.toBar(0));
            expect(sut.consumedLiters(descent)).toBeCloseTo(expected, 6);
        });

        it('isn\'t consumed at flat segment', () => {
            const flat = new Segment(30, 30, StandardGases.air, Time.oneMinute * 10);
            expect(sut.consumedLiters(flat)).toBeCloseTo(0, 6);
        });

        it('isn\'t consumed during ascent', () => {
            const ascent = new Segment(30, 0, StandardGases.air, Time.oneMinute * 3);
            expect(sut.consumedLiters(ascent)).toBeCloseTo(0, 6);
        });
    });

    describe('Oxygen consumption', () => {
        const segment = new Segment(30, 30, StandardGases.air, Time.oneMinute * 10);

        it('adds missing metabolic oxygen manually', () => {
            expect(sut.oxygenLiters(segment)).toBeCloseTo(10, 6);
        });

        it('consumes needle valve flow higher than metabolic', () => {
            const highFlow = createOptions();
            highFlow.o2Flow = 1.5;
            const model = new MccrBreathing(highFlow, [diluent, oxygen], depthConverter);
            expect(model.oxygenLiters(segment)).toBeCloseTo(15, 6);
        });

        it('takes oxygen from the second tank', () => {
            expect(sut.oxygenTank).toBe(oxygen);
        });

        it('has no oxygen tank with single tank', () => {
            const model = new MccrBreathing(options, [diluent], depthConverter);
            expect(model.oxygenTank).toBeUndefined();
        });
    });

    describe('Validation', () => {
        it('accepts oxygen in second tank', () => {
            expect(sut.validate()).toEqual([]);
        });

        it('requires oxygen in second tank', () => {
            const model = new MccrBreathing(options, [diluent, bailout], depthConverter);
            const errors = model.validate();
            expect(errors.length).toBe(1);
            expect(errors[0].type).toBe(EventType.error);
        });

        it('requires second tank', () => {
            const model = new MccrBreathing(options, [diluent], depthConverter);
            expect(model.validate().length).toBe(1);
        });
    });
});
