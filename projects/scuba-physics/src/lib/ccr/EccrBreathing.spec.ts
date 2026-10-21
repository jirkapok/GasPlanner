import { EccrBreathing } from './EccrBreathing';
import { CircuitType, RebreatherOptions } from './RebreatherOptions';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Tank } from '../consumption/Tanks';
import { Time } from '../physics/Time';
import { EventType } from '../algorithm/CalculatedProfile';

describe('eCCR breathing', () => {
    const depthConverter = DepthConverter.forSaltWater();
    const diluent = new Tank(12, 200, 21);
    const oxygen = new Tank(3, 200, 100);
    const bailout = new Tank(11, 200, 50);
    const options = new RebreatherOptions(CircuitType.eccr, 1.0, 6);
    const sut = new EccrBreathing(options, [diluent, oxygen], depthConverter);

    describe('Setpoints', () => {
        it('holds descent setpoint shallower than switch depth', () => {
            expect(sut.ppO2(StandardGases.air, 10, false)).toBeCloseTo(0.7, 6);
        });

        it('holds bottom setpoint deeper than switch depth', () => {
            expect(sut.ppO2(StandardGases.air, 30, false)).toBeCloseTo(1.1, 6);
        });

        it('holds bottom setpoint at switch depth', () => {
            expect(sut.ppO2(StandardGases.air, 20, false)).toBeCloseTo(1.1, 6);
        });

        it('holds deco setpoint during ascent shallower than switch depth', () => {
            expect(sut.ppO2(StandardGases.air, 10, true)).toBeCloseTo(1.3, 6);
        });

        it('holds deco setpoint during ascent deeper than switch depth', () => {
            expect(sut.ppO2(StandardGases.air, 30, true)).toBeCloseTo(1.3, 6);
        });

        it('breathes pure oxygen when deco setpoint is higher than ambient pressure', () => {
            const ambient = depthConverter.toBar(2);
            expect(sut.ppO2(StandardGases.air, 2, true)).toBeCloseTo(ambient, 6);
            expect(sut.inspiredGas(StandardGases.air, 2, true).fO2).toBeCloseTo(1, 6);
        });

        it('breathes diluent ppO2 when diluent is richer than setpoint', () => {
            const diluentPpO2 = StandardGases.air.fO2 * depthConverter.toBar(100);
            expect(sut.ppO2(StandardGases.air, 100, false)).toBeCloseTo(diluentPpO2, 6);
        });

        it('doesn\'t switch gases nor applies air breaks', () => {
            expect(sut.usesGasSwitching).toBeFalse();
            expect(sut.usesAirBreaks).toBeFalse();
        });
    });

    describe('Oxygen consumption', () => {
        const segment = new Segment(30, 30, StandardGases.air, Time.oneMinute * 10);

        it('consumes metabolic oxygen including losses', () => {
            expect(sut.oxygenLiters(segment)).toBeCloseTo(11, 6);
        });

        it('consumes more oxygen with higher metabolic consumption', () => {
            const higher = new RebreatherOptions(CircuitType.eccr, 2.0, 6);
            const model = new EccrBreathing(higher, [diluent, oxygen], depthConverter);
            expect(model.oxygenLiters(segment)).toBeCloseTo(22, 6);
        });

        it('takes oxygen from the second tank', () => {
            expect(sut.oxygenTank).toBe(oxygen);
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

    describe('Validation', () => {
        it('accepts oxygen in second tank', () => {
            expect(sut.validate()).toEqual([]);
        });

        it('requires oxygen in second tank', () => {
            const model = new EccrBreathing(options, [diluent, bailout], depthConverter);
            const errors = model.validate();
            expect(errors.length).toBe(1);
            expect(errors[0].type).toBe(EventType.error);
            expect(errors[0].message).toBe('eCCR needs oxygen in the second tank.');
        });

        it('requires second tank', () => {
            const model = new EccrBreathing(options, [diluent], depthConverter);
            expect(model.validate().length).toBe(1);
        });
    });
});
