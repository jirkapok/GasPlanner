import _ from 'lodash';
import { Time } from '../physics/Time';
import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gas, Gases } from '../gases/Gases';
import { Segments } from '../depths/Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from '../physics/pressure-converter';
import { SafetyStop } from './Options';
import { StandardGases } from '../gases/StandardGases';
import { Precision } from '../common/precision';
import { Tank } from '../consumption/Tanks';
import { Diver } from '../consumption/Diver';
import { DepthConverter } from '../physics/depth-converter';
import { Consumption, ConsumptionOptions } from '../consumption/consumption';
import { AlgorithmParams } from "./BuhlmannAlgorithmParameters";

// TODO test Air dive to 40 m/70 min. - consumption calculation never ends. => needs option interrupt the task.
// Lets assign reserve to all asserts on slower machines at github.
describe('Performance', () => {
    const assertDuration = (message: string, limit: number, actionToMeasure: () => void): void => {
        const iterations = 1;
        const results: number[] = [];

        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            actionToMeasure();
            const endTime = performance.now();

            const methodDuration = Precision.round(endTime - startTime);
            results.push(methodDuration);
        }

        const averageDuration = _(results).mean();
        console.log(`${message}: ${averageDuration} ms (max ${limit} ms)`);
        expect(averageDuration).toBeLessThan(limit);
    };

    it('Decompression is calculated within 150 ms', () => {
        const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
        options.safetyStop = SafetyStop.always;
        options.salinity = Salinity.salt;
        options.roundStopsToMinutes = true;
        options.decoStopDistance = 3;
        options.altitude = 0;

        const gases = new Gases();
        gases.add(StandardGases.trimix1260);
        gases.add(StandardGases.trimix3525);
        gases.add(new Gas(0.5, 0.2));
        gases.add(StandardGases.oxygen);

        const segments = new Segments();
        segments.add(10, StandardGases.trimix3525, Time.oneMinute);
        segments.add(75, StandardGases.trimix1260, 5 * Time.oneMinute);
        segments.addFlat(StandardGases.trimix1260, 5 * Time.oneMinute);

        const algorithm = new BuhlmannAlgorithm();
        const parameters = AlgorithmParams.forMultilevelDive(segments, gases, options);

        assertDuration(`Decompression calculation duration`, 150,
            () => algorithm.decompression(parameters));
    });

    it('No decompression time calculated within 50 ms', () => {
        const options = OptionExtensions.createOptions(1, 1, 1.6, 1.6, Salinity.fresh);
        const algorithm = new BuhlmannAlgorithm();

        const simpleDive = AlgorithmParams.forSimpleDive(6, StandardGases.air, options);

        assertDuration(`No Decompression Limit calculation duration`, 50,
            () => algorithm.noDecoLimit(simpleDive));
    });

    it('Consumption Max bottom time is calculated within 1000 ms', () => {
        const consumptionOptions: ConsumptionOptions = {
            diver: new Diver(20),
            primaryTankReserve: Consumption.defaultPrimaryReserve,
            stageTankReserve: 0
        };
        const consumption = new Consumption(DepthConverter.forFreshWater());
        const options2 = OptionExtensions.createOptions(1, 1, 1.4, 1.6, Salinity.fresh);
        options2.safetyStop = SafetyStop.never;
        options2.problemSolvingDuration = 2;

        const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
        options.safetyStop = SafetyStop.always;
        options.problemSolvingDuration = 2;
        const tank = new Tank(24, 200, 21);
        const tanks = [tank];

        const segments = new Segments();
        segments.add(5, tank.gas, Time.oneMinute);
        segments.addFlat(tank.gas, Time.oneMinute * 10);

        assertDuration(`Consumption Max bottom time duration`, 1000,
            () => consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, options));
    });
});
