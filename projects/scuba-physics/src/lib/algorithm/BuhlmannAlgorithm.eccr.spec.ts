import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { AlgorithmParams } from './BuhlmannAlgorithmParameters';
import { OptionExtensions } from './Options.testing';
import { EventType } from './CalculatedProfile';
import { EccrBreathing } from '../ccr/EccrBreathing';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Gas } from '../gases/Gases';
import { Segment, Segments } from '../depths/Segments';
import { Salinity } from '../physics/pressure-converter';
import { Tank, Tanks } from '../consumption/Tanks';
import { Time } from '../physics/Time';

/** Open circuit, which remembers the ascent flag of every breath */
class RecordingBreathing extends OpenCircuitBreathing {
    public readonly calls: { depth: number; isAscent: boolean }[] = [];

    public override inspiredGas(sourceGas: Gas, depth = 0, isAscent = false): Gas {
        this.calls.push({ depth, isAscent });
        return super.inspiredGas(sourceGas);
    }
}

describe('Buhlmann Algorithm - eCCR', () => {
    const algorithm = new BuhlmannAlgorithm();
    const options = OptionExtensions.createOptions(0.3, 0.85, 1.4, 1.6, Salinity.salt);
    const depthConverter = new DepthConverterFactory(options).create();

    describe('Deco setpoint starts after the deepest point', () => {
        const tank = new Tank(15, 200, 21);
        const gas = tank.gas;
        // seconds spent at the deepest part of the plan: descent and bottom
        const deepestPartDuration = Time.oneMinute * 12;

        const createMultilevel = (): Segments => {
            const segments = new Segments();
            segments.add(40, gas, Time.oneMinute * 2);
            segments.addFlat(gas, Time.oneMinute * 10);
            segments.add(21, gas, Time.oneMinute * 2);
            segments.addFlat(gas, Time.oneMinute * 5);
            return segments;
        };

        const createParams = (segments: Segments, breathing: BreathingModel): AlgorithmParams => {
            const gases = Tanks.toGases([tank]);
            return AlgorithmParams.forMultilevelDive(segments, gases, options, breathing);
        };

        const ascentFlags = (recording: RecordingBreathing): boolean[] => recording.calls.map(c => c.isAscent);

        it('decompression breathes the deepest part as bottom and the rest as ascent', () => {
            const recording = new RecordingBreathing(depthConverter);
            algorithm.decompression(createParams(createMultilevel(), recording));
            const flags = ascentFlags(recording);
            expect(flags.length).toBeGreaterThan(deepestPartDuration);
            expect(flags.slice(0, deepestPartDuration).every(f => !f)).toBe(true);
            expect(flags.slice(deepestPartDuration).every(f => f)).toBe(true);
        });

        it('statistics of calculated profile use the same ascent flags', () => {
            const profile = algorithm.decompression(createParams(createMultilevel(), OptionExtensions.openCircuit(options))).segments;
            const recording = new RecordingBreathing(depthConverter);
            algorithm.decompressionStatistics(createParams(Segments.fromCollection(profile), recording));
            const flags = ascentFlags(recording);
            expect(flags.length).toBeGreaterThan(deepestPartDuration);
            expect(flags.slice(0, deepestPartDuration).every(f => !f)).toBe(true);
            expect(flags.slice(deepestPartDuration).every(f => f)).toBe(true);
        });

        it('no decompression limits of calculated profile use the same ascent flags', () => {
            const profile = algorithm.decompression(createParams(createMultilevel(), OptionExtensions.openCircuit(options))).segments;
            const recording = new RecordingBreathing(depthConverter);
            const dive = createParams(createMultilevel(), recording);
            Array.from(algorithm.noDecoLimitsOfProfile(dive, profile));
            const flags = ascentFlags(recording);
            const firstAscent = flags.indexOf(true);
            expect(firstAscent).toBeGreaterThan(0);
            expect(flags.slice(firstAscent).every(f => f)).toBe(true);
            expect(recording.calls.some(c => c.depth === 21 && c.isAscent)).toBe(true);
            expect(recording.calls.some(c => c.depth === 40 && !c.isAscent)).toBe(true);
        });
    });

    describe('Setpoints', () => {
        const diluent = new Tank(12, 200, 21);
        diluent.gas.fHe = 0.35;
        const oxygen = new Tank(3, 200, 100);
        const ean50 = new Tank(11, 200, 50);
        const tanks = [diluent, oxygen, ean50];

        const createEccr = (bottomSetpoint: number, decoSetpoint: number, diveTanks: Tank[]): EccrBreathing => {
            const rebreather = new RebreatherOptions(CircuitType.eccr);
            rebreather.bottomSetpoint = bottomSetpoint;
            rebreather.decoSetpoint = decoSetpoint;
            return new EccrBreathing(rebreather, diveTanks, depthConverter);
        };

        const createParams = (breathing: BreathingModel, diveTanks: Tank[]): AlgorithmParams => {
            const segments = new Segments();
            segments.add(40, diluent.gas, Time.oneMinute * 2);
            segments.addFlat(diluent.gas, Time.oneMinute * 23);
            return AlgorithmParams.forMultilevelDive(segments, Tanks.toGases(diveTanks), options, breathing);
        };

        const calculate = (breathing: BreathingModel, diveTanks: Tank[] = tanks): Segment[] =>
            algorithm.decompression(createParams(breathing, diveTanks)).segments;

        const runtime = (breathing: BreathingModel): number => Segments.duration(calculate(breathing));

        it('stays on the diluent without gas switches or air breaks', () => {
            const profile = calculate(createEccr(1.1, 1.3, tanks));
            const allOnDiluent = profile.every(s => s.gas.compositionEquals(diluent.gas));
            expect(allOnDiluent).toBe(true);
            expect(profile[profile.length - 1].endDepth).toBe(0);
        });

        it('higher deco setpoint shortens the decompression', () => {
            expect(runtime(createEccr(1.1, 1.3, tanks))).toBeLessThan(runtime(createEccr(1.1, 1.1, tanks)));
        });

        it('higher bottom setpoint shortens the decompression', () => {
            expect(runtime(createEccr(1.3, 1.3, tanks))).toBeLessThan(runtime(createEccr(1.1, 1.3, tanks)));
        });

        it('requires oxygen in the second tank', () => {
            const invalidTanks = [diluent, ean50];
            const breathing = createEccr(1.1, 1.3, invalidTanks);
            const profile = algorithm.decompression(createParams(breathing, invalidTanks));
            expect(profile.errors.length).toBe(1);
            expect(profile.errors[0].type).toBe(EventType.error);
            expect(algorithm.noDecoLimit(createParams(breathing, invalidTanks))).toBe(0);
        });
    });
});
