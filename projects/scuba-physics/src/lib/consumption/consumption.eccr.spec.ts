import { Consumption } from './consumption';
import { ConsumptionOptions } from './consumptionCommon';
import { Diver } from './Diver';
import { Tank, Tanks } from './Tanks';
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams } from '../algorithm/BuhlmannAlgorithmParameters';
import { OptionExtensions } from '../algorithm/Options.testing';
import { PlanFactory } from '../depths/PlanFactory';
import { Segment } from '../depths/Segments';
import { DepthConverter } from '../physics/depth-converter';
import { Salinity } from '../physics/pressure-converter';
import { EccrBreathing } from '../ccr/EccrBreathing';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { Rebreathers } from '../ccr/Rebreathers';
import { StandardGases } from '../gases/StandardGases';
import { Time } from '../physics/Time';

describe('Consumption - eCCR', () => {
    const depthConverter = DepthConverter.simple();
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: Consumption.defaultPrimaryReserve,
        stageTankReserve: Consumption.defaultStageReserve
    };

    let diluent: Tank;
    let oxygen: Tank;
    let bailout: Tank;
    let profile: Segment[];
    let emergencyAscent: Segment[];

    beforeEach(() => {
        diluent = new Tank(12, 200, 18);
        diluent.gas.fHe = 0.45;
        oxygen = new Tank(3, 200, 100);
        bailout = new Tank(11, 200, 21);
        const tanks = [diluent, oxygen, bailout];
        const eccr = new EccrBreathing(new RebreatherOptions(CircuitType.eccr), tanks, depthConverter);
        const plan = PlanFactory.createPlan(40, 25, diluent, options);
        const parameters = AlgorithmParams.forMultilevelDive(plan, Tanks.toGases(tanks), options, eccr);
        profile = new BuhlmannAlgorithm().decompression(parameters).segments;
        emergencyAscent = PlanFactory.emergencyAscent(profile, options, tanks, eccr);
        new Consumption(depthConverter, eccr).consumeFromTanks2(profile, emergencyAscent, tanks, consumptionOptions);
    });

    it('consumes metabolic oxygen including losses for the whole dive', () => {
        const runtimeMinutes = Time.toMinutes(profile.reduce((sum, s) => sum + s.duration, 0));
        const expected = runtimeMinutes * Rebreathers.eccrO2Rate(1.0, 0.1);
        expect(oxygen.consumedVolume).toBeCloseTo(expected, 1);
    });

    it('consumes diluent only to fill the loop during descent', () => {
        const expected = 6 * (depthConverter.toBar(40) - depthConverter.toBar(0));
        expect(diluent.consumedVolume).toBeCloseTo(expected, 6);
    });

    it('bailout tank keeps only the reserve', () => {
        expect(bailout.consumedVolume).toBeCloseTo(0, 6);
        expect(bailout.reserveVolume).toBeGreaterThan(0);
    });

    it('oxygen tank reserve covers the oxygen breathed during emergency ascent', () => {
        const openCircuit = new OpenCircuitBreathing(depthConverter);
        const stressRmvPerSecond = Time.toMinutes(consumptionOptions.diver.stressRmv);
        const expected = emergencyAscent
            .filter(s => s.gas.compositionEquals(StandardGases.oxygen))
            .reduce((sum, s) => sum + openCircuit.consumedLiters(s, stressRmvPerSecond), 0);
        expect(oxygen.reserveVolume).toBeCloseTo(expected, 6);
    });
});
