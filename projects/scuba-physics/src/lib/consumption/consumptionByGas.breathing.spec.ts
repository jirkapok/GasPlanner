import { ConsumptionByGas } from './consumptionByGas';
import { ConsumptionOptions } from './consumptionCommon';
import { Consumption } from './consumption';
import { Diver } from './Diver';
import { Tank, Tanks } from './Tanks';
import { BuhlmannAlgorithm } from '../algorithm/BuhlmannAlgorithm';
import { AlgorithmParams } from '../algorithm/BuhlmannAlgorithmParameters';
import { OptionExtensions } from '../algorithm/Options.spec';
import { PlanFactory } from '../depths/PlanFactory';
import { Segment } from '../depths/Segments';
import { DepthConverter } from '../physics/depth-converter';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';
import { OpenCircuitBreathing } from '../ccr/BreathingModel';
import { PscrBreathing } from '../ccr/PscrBreathing';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';

describe('Consumption by gas - Breathing model', () => {
    const depthConverter = DepthConverter.simple();
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: Consumption.defaultPrimaryReserve,
        stageTankReserve: Consumption.defaultStageReserve
    };
    const tank = new Tank(11, 200, 32);
    const plan = PlanFactory.createPlan(20, 30, tank, options);
    const profile: Segment[] = new BuhlmannAlgorithm()
        .decompression(AlgorithmParams.forMultilevelDive(plan, Tanks.toGases([tank]), options)).segments;
    const emergencyAscent = PlanFactory.emergencyAscent(profile, options, [tank]);

    it('explicit open circuit gives the same result as without model', () => {
        const withModel = new ConsumptionByGas(depthConverter, new OpenCircuitBreathing(depthConverter))
            .consume(profile, emergencyAscent, [tank], consumptionOptions);
        const withoutModel = new ConsumptionByGas(depthConverter).consume(profile, emergencyAscent, [tank], consumptionOptions);
        expect(withModel).toEqual(withoutModel);
    });

    it('consumes by the breathing model, reserve stays open circuit', () => {
        const pscr = new PscrBreathing(new RebreatherOptions(CircuitType.pscr), 20, depthConverter);
        const rmvPerSecond = Time.toMinutes(consumptionOptions.diver.rmv);
        const expected = profile.reduce((sum, segment) => sum + pscr.consumedLiters(segment, rmvPerSecond), 0);
        const openCircuit = new ConsumptionByGas(depthConverter).consume(profile, emergencyAscent, [tank], consumptionOptions);

        const pscrResult = new ConsumptionByGas(depthConverter, pscr).consume(profile, emergencyAscent, [tank], consumptionOptions);

        expect(pscrResult[0].consumed).toBeCloseTo(expected, 6);
        expect(pscrResult[0].reserve).toBeCloseTo(openCircuit[0].reserve, 6);
    });
});
