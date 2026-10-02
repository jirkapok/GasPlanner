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
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: Consumption.defaultPrimaryReserve,
        stageTankReserve: Consumption.defaultStageReserve
    };

    const createProfile = (tank: Tank): Segment[] => {
        const plan = PlanFactory.createPlan(30, 20, tank, options);
        const parameters = AlgorithmParams.forMultilevelDive(plan, Tanks.toGases([tank]), options);
        return new BuhlmannAlgorithm().decompression(parameters).segments;
    };

    it('consumes plan segments by breathing model liters', () => {
        const tank = new Tank(15, 200, 21);
        const profile = createProfile(tank);
        const emergencyAscent = PlanFactory.emergencyAscent(profile, options, [tank]);
        const model = new OpenCircuitBreathing(depthConverter);
        const rmvPerSecond = Time.toMinutes(consumptionOptions.diver.rmv);
        const expected = profile.reduce((sum, segment) => sum + model.consumedLiters(segment, rmvPerSecond), 0);

        new Consumption(depthConverter, model).consumeFromTanks2(profile, emergencyAscent, [tank], consumptionOptions);

        expect(tank.consumedVolume).toBeCloseTo(expected, 6);
    });

    it('explicit open circuit consumes the same as without model', () => {
        const defaultTank = new Tank(15, 200, 21);
        const modelTank = new Tank(15, 200, 21);
        // segments reference the tank they consume from, so each tank needs its own profile
        const defaultProfile = createProfile(defaultTank);
        const modelProfile = createProfile(modelTank);
        const model = new OpenCircuitBreathing(depthConverter);

        new Consumption(depthConverter).consumeFromTanks(defaultProfile, options, [defaultTank], consumptionOptions);
        new Consumption(depthConverter, model).consumeFromTanks(modelProfile, options, [modelTank], consumptionOptions);

        expect(modelTank.consumedVolume).toBeCloseTo(defaultTank.consumedVolume, 6);
        expect(modelTank.reserveVolume).toBeCloseTo(defaultTank.reserveVolume, 6);
    });

    it('explicit open circuit gives the same maximum bottom time', () => {
        const plan = PlanFactory.createPlan(30, 20, new Tank(15, 200, 21), options);
        const defaultTime = new Consumption(depthConverter)
            .calculateMaxBottomTime(plan, [new Tank(15, 200, 21)], consumptionOptions, options);
        const modelTime = new Consumption(depthConverter, new OpenCircuitBreathing(depthConverter))
            .calculateMaxBottomTime(plan, [new Tank(15, 200, 21)], consumptionOptions, options);
        expect(modelTime).toBe(defaultTime);
    });
});
