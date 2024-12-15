import { Time } from './Time';
import { AlgorithmParams, BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gas, Gases } from './Gases';
import { Segment, Segments } from './Segments';
import { OptionExtensions } from './Options.spec';
import { Salinity } from './pressure-converter';
import { Options, SafetyStop } from './Options';
import { StandardGases } from './StandardGases';
import { Precision } from './precision';
import { FeatureFlags } from './featureFlags';
import { Tank } from './Tanks';
import { Diver } from './Diver';
import { DepthConverter } from './depth-converter';
import { Consumption, ConsumptionOptions } from './consumption';


export function calculatePlanFor(gases: Gases, source: Segments, options: Options): Segment[] {
    const algorithm = new BuhlmannAlgorithm();
    const parameters = AlgorithmParams.forMultilevelDive(source, gases, options);
    const decoPlan = algorithm.decompression(parameters);
    return decoPlan.segments;
}

describe('Buhlmann Algorithm - Performance', () => {
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.salt);
    options.safetyStop = SafetyStop.always;

    beforeEach(() => {
        options.safetyStop = SafetyStop.always;
        options.salinity = Salinity.salt;
        options.roundStopsToMinutes = true;
        options.decoStopDistance = 3;
        options.altitude = 0;
    });

    it('for trimix 75 m deep dive is calculated within 400 ms', () => {
        FeatureFlags.Instance.collectSaturation = true;

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

        const startTime = performance.now();
        algorithm.decompression(parameters);
        const endTime = performance.now();

        const methodDuration = Precision.round(endTime - startTime);
        console.log(`Decompression calculation duration: ${methodDuration} ms`);

        expect(methodDuration).toBeLessThan(400);
    });
});

describe('Buhlmann Algorithm - No decompression times', () => {
    it('Calculates No Decompression Limit at 10m within 100 ms', () => {
        const options = OptionExtensions.createOptions(1, 1, 1.6, 1.6, Salinity.fresh);
        const algorithm = new BuhlmannAlgorithm();

        const startTime = performance.now();
        const simpleDive = AlgorithmParams.forSimpleDive(10, StandardGases.air, options);
        const ndl = algorithm.noDecoLimit(simpleDive);
        const endTime = performance.now();

        const methodDuration = Precision.round(endTime - startTime);
        console.log(`No Decompression Limit calculation duration: ${methodDuration} ms`);

        expect(ndl).toBe(473);
        expect(methodDuration).toBeLessThan(100);
    });
});

describe('Consumption - Performance', () => {
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

    // This tests is performance dependent, should usually finish within 300 ms,
    // but let assign reserve on slower machines at github.
    describe('Max bottom time', () => {
        it('for long dives is calculated within 550 ms', () => {
            const tank = new Tank(24, 200, 21);
            const tanks = [tank];

            const segments = new Segments();
            segments.add(5, tank.gas, Time.oneMinute);
            segments.addFlat(tank.gas, Time.oneMinute * 10);

            const startTime = performance.now();
            consumption.calculateMaxBottomTime(segments, tanks, consumptionOptions, options);
            const endTime = performance.now();
            const methodDuration = Precision.round(endTime - startTime);

            console.log(`Max bottom time duration: ${methodDuration} ms`);
            expect(methodDuration).toBeLessThan(550);
        });
    });
});

