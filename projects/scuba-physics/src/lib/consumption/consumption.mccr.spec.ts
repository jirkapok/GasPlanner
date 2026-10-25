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
import { MccrBreathing } from '../ccr/MccrBreathing';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { StandardGases } from '../gases/StandardGases';
import { Time } from '../physics/Time';

describe('Consumption - mCCR', () => {
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
    let tanks: Tank[];
    let mccr: MccrBreathing;
    let profile: Segment[];
    let emergencyAscent: Segment[];

    beforeEach(() => {
        diluent = new Tank(12, 200, 21);
        oxygen = new Tank(3, 200, 100);
        bailout = new Tank(11, 200, 21);
        tanks = [diluent, oxygen, bailout];
        mccr = new MccrBreathing(new RebreatherOptions(CircuitType.mccr), tanks, depthConverter);
        const plan = PlanFactory.createPlan(30, 30, diluent, options);
        const parameters = AlgorithmParams.forMultilevelDive(plan, Tanks.toGases(tanks), options, mccr);
        profile = new BuhlmannAlgorithm().decompression(parameters).segments;
        emergencyAscent = PlanFactory.emergencyAscent(profile, options, tanks, mccr);
        new Consumption(depthConverter, mccr).consumeFromTanks2(profile, emergencyAscent, tanks, consumptionOptions);
    });

    it('consumes oxygen by the mCCR oxygen rate for the whole dive', () => {
        const runtimeMinutes = Time.toMinutes(profile.reduce((sum, s) => sum + s.duration, 0));
        // metabolic oxygen 1 l/min is higher than the default needle valve flow
        expect(oxygen.consumedVolume).toBeCloseTo(runtimeMinutes * 1, 1);
    });

    it('consumes diluent only to fill the loop during descent', () => {
        const expected = 6 * (depthConverter.toBar(30) - depthConverter.toBar(0));
        expect(diluent.consumedVolume).toBeCloseTo(expected, 6);
    });

    it('bailout tank keeps only the reserve', () => {
        expect(bailout.consumedVolume).toBeCloseTo(0, 6);
    });

    it('oxygen tank reserve covers the oxygen breathed during emergency ascent', () => {
        const openCircuit = new OpenCircuitBreathing(depthConverter);
        const stressRmvPerSecond = Time.toMinutes(consumptionOptions.diver.stressRmv);
        const expected = emergencyAscent
            .filter(s => s.gas.compositionEquals(StandardGases.oxygen))
            .reduce((sum, s) => sum + openCircuit.consumedLiters(s, stressRmvPerSecond), 0);
        const minimalReserve = Tank.realVolume2(oxygen.size, Consumption.defaultStageReserve, oxygen.gas);

        expect(expected).toBeGreaterThan(minimalReserve);
        expect(oxygen.reserveVolume).toBeCloseTo(expected, 6);
    });
});
