import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { AlgorithmParams } from './BuhlmannAlgorithmParameters';
import { OptionExtensions } from './Options.spec';
import { EventType } from './CalculatedProfile';
import { MccrBreathing } from '../ccr/MccrBreathing';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { BreathingModel } from '../ccr/BreathingModel';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Gas } from '../gases/Gases';
import { Segment, Segments } from '../depths/Segments';
import { Salinity } from '../physics/pressure-converter';
import { Tank, Tanks } from '../consumption/Tanks';
import { Time } from '../physics/Time';

describe('Buhlmann Algorithm - mCCR', () => {
    const algorithm = new BuhlmannAlgorithm();
    const options = OptionExtensions.createOptions(0.3, 0.85, 1.4, 1.6, Salinity.salt);
    const depthConverter = new DepthConverterFactory(options).create();
    const diluent = new Tank(12, 200, 21);
    diluent.gas.fHe = 0.35;
    const oxygen = new Tank(3, 200, 100);
    const ean50 = new Tank(11, 200, 50);
    const tanks = [diluent, oxygen, ean50];

    const createMccr = (setpoint: number, diveTanks: Tank[]): MccrBreathing => {
        const rebreather = new RebreatherOptions(CircuitType.mccr);
        rebreather.setpoint = setpoint;
        return new MccrBreathing(rebreather, diveTanks, depthConverter);
    };

    const createParams = (gas: Gas, breathing: BreathingModel, diveTanks: Tank[]): AlgorithmParams => {
        const segments = new Segments();
        segments.add(40, gas, Time.oneMinute * 2);
        segments.addFlat(gas, Time.oneMinute * 23);
        const gases = Tanks.toGases(diveTanks);
        return AlgorithmParams.forMultilevelDive(segments, gases, options, breathing);
    };

    const calculate = (gas: Gas, breathing: BreathingModel, diveTanks: Tank[]): Segment[] => {
        const params = createParams(gas, breathing, diveTanks);
        return algorithm.decompression(params).segments;
    };

    const runtime = (gas: Gas, breathing: BreathingModel): number => Segments.duration(calculate(gas, breathing, tanks));

    it('stays on the diluent without gas switches or air breaks', () => {
        const profile = calculate(diluent.gas, createMccr(1.3, tanks), tanks);
        const allOnDiluent = profile.every(s => s.gas.compositionEquals(diluent.gas));
        expect(allOnDiluent).toBeTrue();
        expect(profile[profile.length - 1].endDepth).toBe(0);
    });

    it('needs different decompression than open circuit with the same gases', () => {
        const openCircuit = OptionExtensions.openCircuit(options);
        expect(runtime(diluent.gas, createMccr(1.3, tanks))).not.toBe(runtime(diluent.gas, openCircuit));
    });

    it('higher setpoint shortens the decompression', () => {
        expect(runtime(diluent.gas, createMccr(1.3, tanks))).toBeLessThan(runtime(diluent.gas, createMccr(0.7, tanks)));
    });

    describe('Second tank is not oxygen', () => {
        const invalidTanks = [diluent, ean50];
        const mccr = createMccr(1.3, invalidTanks);

        it('decompression returns error', () => {
            const params = createParams(diluent.gas, mccr, invalidTanks);
            const errors = algorithm.decompression(params).errors;
            expect(errors.length).toBe(1);
            expect(errors[0].type).toBe(EventType.error);
        });

        it('no decompression limit is 0', () => {
            const params = createParams(diluent.gas, mccr, invalidTanks);
            expect(algorithm.noDecoLimit(params)).toBe(0);
        });
    });
});
