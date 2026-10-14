import { Consumption } from './consumption';
import { ConsumptionOptions } from './consumptionCommon';
import { Diver } from './Diver';
import { Tank, Tanks } from './Tanks';
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams } from '../algorithm/BuhlmannAlgorithmParameters';
import { OptionExtensions } from '../algorithm/Options.spec';
import { PlanFactory } from '../depths/PlanFactory';
import { Segment } from '../depths/Segments';
import { DepthConverter } from '../physics/depth-converter';
import { Salinity } from '../physics/pressure-converter';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';
import { Time } from '../physics/Time';

describe('Consumption - Breathing model', () => {
    const depthConverter = DepthConverter.simple();
    const openCircuit = new OpenCircuitBreathing(depthConverter);
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: Consumption.defaultPrimaryReserve,
        stageTankReserve: Consumption.defaultStageReserve
    };

    const createProfile = (tank: Tank): Segment[] => {
        const plan = PlanFactory.createPlan(30, 20, tank, options);
        const parameters = AlgorithmParams.forMultilevelDive(plan, Tanks.toGases([tank]), options, openCircuit);
        return new BuhlmannAlgorithm().decompression(parameters).segments;
    };

    it('consumes plan segments by breathing model liters', () => {
        const tank = new Tank(15, 200, 21);
        const profile = createProfile(tank);
        const emergencyAscent = PlanFactory.emergencyAscent(profile, options, [tank], openCircuit);
        const rmvPerSecond = Time.toMinutes(consumptionOptions.diver.rmv);
        const expected = profile.reduce((sum, segment) => sum + openCircuit.consumedLiters(segment, rmvPerSecond), 0);

        new Consumption(depthConverter, openCircuit).consumeFromTanks2(profile, emergencyAscent, [tank], consumptionOptions);

        expect(tank.consumedVolume).toBeCloseTo(expected, 6);
    });
});
