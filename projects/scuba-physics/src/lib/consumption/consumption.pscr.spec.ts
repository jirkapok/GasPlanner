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
import { PscrBreathing } from '../ccr/PscrBreathing';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { Time } from '../physics/Time';

describe('Consumption - pSCR', () => {
    const depthConverter = DepthConverter.simple();
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    const pscr = new PscrBreathing(new RebreatherOptions(CircuitType.pscr), 20, depthConverter);
    const openCircuit = new OpenCircuitBreathing(depthConverter);
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: Consumption.defaultPrimaryReserve,
        stageTankReserve: Consumption.defaultStageReserve
    };

    const createProfile = (tank: Tank): Segment[] => {
        const plan = PlanFactory.createPlan(20, 30, tank, options);
        const parameters = AlgorithmParams.forMultilevelDive(plan, Tanks.toGases([tank]), options, pscr);
        return new BuhlmannAlgorithm().decompression(parameters).segments;
    };

    it('consumes supply gas by injection ratio', () => {
        const tank = new Tank(11, 200, 32);
        const profile = createProfile(tank);
        const emergencyAscent = PlanFactory.emergencyAscent(profile, options, [tank], pscr);
        const rmvPerSecond = Time.toMinutes(consumptionOptions.diver.rmv);
        const expected = profile.reduce((sum, segment) => sum + pscr.consumedLiters(segment, rmvPerSecond), 0);

        new Consumption(depthConverter, pscr).consumeFromTanks2(profile, emergencyAscent, [tank], consumptionOptions);

        expect(tank.consumedVolume).toBeCloseTo(expected, 6);
    });

    it('consumes less than open circuit', () => {
        const pscrTank = new Tank(11, 200, 32);
        const ocTank = new Tank(11, 200, 32);
        const pscrProfile = createProfile(pscrTank);
        const ocProfile = createProfile(ocTank);

        new Consumption(depthConverter, pscr).consumeFromTanks(pscrProfile, options, [pscrTank], consumptionOptions);
        new Consumption(depthConverter, openCircuit).consumeFromTanks(ocProfile, options, [ocTank], consumptionOptions);

        expect(pscrTank.consumedVolume).toBeLessThan(ocTank.consumedVolume);
    });

    it('reserve is higher than open circuit, because the bottom before bailout is breathed from the leaner loop', () => {
        // deep and long enough, so the bailout ascent needs decompression
        const deepProfile = (tank: Tank, breathing: BreathingModel): Segment[] => {
            const plan = PlanFactory.createPlan(30, 40, tank, options);
            const parameters = AlgorithmParams.forMultilevelDive(plan, Tanks.toGases([tank]), options, breathing);
            return new BuhlmannAlgorithm().decompression(parameters).segments;
        };
        const pscrTank = new Tank(15, 200, 32);
        const ocTank = new Tank(15, 200, 32);
        const pscrProfile = deepProfile(pscrTank, pscr);
        const ocProfile = deepProfile(ocTank, openCircuit);

        new Consumption(depthConverter, pscr).consumeFromTanks(pscrProfile, options, [pscrTank], consumptionOptions);
        new Consumption(depthConverter, openCircuit).consumeFromTanks(ocProfile, options, [ocTank], consumptionOptions);

        expect(pscrTank.reserveVolume).toBeGreaterThan(ocTank.reserveVolume);
    });
});
