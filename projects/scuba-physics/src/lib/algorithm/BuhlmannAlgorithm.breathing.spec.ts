import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { AlgorithmParams } from './BuhlmannAlgorithmParameters';
import { OptionExtensions } from './Options.spec';
import { Options } from './Options';
import { BreathingModel, OpenCircuitBreathing } from '../ccr/BreathingModel';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Gas, Gases } from '../gases/Gases';
import { Segments } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';

describe('Buhlmann Algorithm - Breathing model', () => {
    const algorithm = new BuhlmannAlgorithm();
    let options: Options;

    beforeEach(() => {
        options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    });

    const createParams = (depth: number, minutes: number, gases: Gas[], breathing?: BreathingModel): AlgorithmParams => {
        const segments = new Segments();
        segments.add(depth, gases[0], Time.oneMinute * 2);
        segments.addFlat(gases[0], Time.oneMinute * (minutes - 2));
        const available = new Gases();
        gases.forEach(g => available.add(g));
        return AlgorithmParams.forMultilevelDive(segments, available, options, undefined, breathing);
    };

    const planDuration = (depth: number, minutes: number, gases: Gas[], breathing?: BreathingModel): number => {
        const profile = algorithm.decompression(createParams(depth, minutes, gases, breathing));
        return Segments.duration(profile.segments);
    };

    const openCircuit = (): OpenCircuitBreathing => new OpenCircuitBreathing(new DepthConverterFactory(options).create());

    it('explicit open circuit gives same profile as without model', () => {
        const gases = [StandardGases.air];
        expect(planDuration(30, 25, gases, openCircuit())).toBe(planDuration(30, 25, gases));
    });

    it('explicit open circuit switches deco gases the same way', () => {
        const gases = [StandardGases.air, StandardGases.ean50];
        const withModel = algorithm.decompression(createParams(40, 30, gases, openCircuit())).segments;
        const withoutModel = algorithm.decompression(createParams(40, 30, gases)).segments;
        expect(withModel.length).toBe(withoutModel.length);
        withModel.forEach((segment, index) => {
            expect(segment.gas.compositionEquals(withoutModel[index].gas)).toBeTrue();
            expect(segment.duration).toBe(withoutModel[index].duration);
        });
    });

    it('explicit open circuit applies air breaks the same way', () => {
        const gases = [new Gas(0.18, 0.45), StandardGases.ean50, StandardGases.oxygen];
        options.airBreaks.enabled = true;
        expect(planDuration(60, 40, gases, openCircuit())).toBe(planDuration(60, 40, gases));
    });

    it('explicit open circuit gives same no decompression limit', () => {
        const withModel = algorithm.noDecoLimit(AlgorithmParams.forSimpleDive(30, StandardGases.air, options, undefined, openCircuit()));
        const withoutModel = algorithm.noDecoLimit(AlgorithmParams.forSimpleDive(30, StandardGases.air, options));
        expect(withModel).toBe(withoutModel);
    });

    it('explicit open circuit gives same statistics', () => {
        const gases = [StandardGases.air];
        const withModel = algorithm.decompressionStatistics(createParams(40, 20, gases, openCircuit()));
        const withoutModel = algorithm.decompressionStatistics(createParams(40, 20, gases));
        expect(withModel.ceilings).toEqual(withoutModel.ceilings);
    });
});
