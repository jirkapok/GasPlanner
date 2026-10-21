import { ConsumedGas, ConsumptionByGas } from './consumptionByGas';
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
import { EccrBreathing } from '../ccr/EccrBreathing';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { StandardGases } from '../gases/StandardGases';
import { Gas } from '../gases/Gases';

describe('Consumption by gas - eCCR', () => {
    const depthConverter = DepthConverter.simple();
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    const consumptionOptions: ConsumptionOptions = {
        diver: new Diver(20),
        primaryTankReserve: Consumption.defaultPrimaryReserve,
        stageTankReserve: Consumption.defaultStageReserve
    };
    const diluent = new Tank(12, 200, 21);
    const oxygen = new Tank(3, 200, 100);
    const tanks = [diluent, oxygen];
    const eccr = new EccrBreathing(new RebreatherOptions(CircuitType.eccr), tanks, depthConverter);
    const plan = PlanFactory.createPlan(30, 30, diluent, options);
    const profile: Segment[] = new BuhlmannAlgorithm()
        .decompression(AlgorithmParams.forMultilevelDive(plan, Tanks.toGases(tanks), options, eccr)).segments;
    const emergencyAscent = PlanFactory.emergencyAscent(profile, options, tanks, eccr);
    const result = new ConsumptionByGas(depthConverter, eccr).consume(profile, emergencyAscent, tanks, consumptionOptions);
    const byGas = (gas: Gas): ConsumedGas => result.find(g => g.gas.compositionEquals(gas)) as ConsumedGas;

    it('consumes oxygen from the oxygen tank gas', () => {
        const expected = profile.reduce((sum, s) => sum + eccr.oxygenLiters(s), 0);
        expect(expected).toBeGreaterThan(0);
        expect(byGas(StandardGases.oxygen).consumed).toBeCloseTo(expected, 6);
    });

    it('consumes diluent only to fill the loop', () => {
        const expected = 6 * (depthConverter.toBar(30) - depthConverter.toBar(0));
        expect(byGas(StandardGases.air).consumed).toBeCloseTo(expected, 6);
    });

    it('reserves both gases for the emergency ascent', () => {
        expect(byGas(StandardGases.air).reserve).toBeGreaterThan(0);
        expect(byGas(StandardGases.oxygen).reserve).toBeGreaterThan(0);
    });
});
