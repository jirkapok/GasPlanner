import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { AlgorithmParams } from './BuhlmannAlgorithmParameters';
import { OptionExtensions } from './Options.spec';
import { PscrBreathing } from '../ccr/PscrBreathing';
import { CircuitType, RebreatherOptions } from '../ccr/RebreatherOptions';
import { BreathingModel } from '../ccr/BreathingModel';
import { DepthConverterFactory } from '../physics/depth-converter';
import { Gas, Gases } from '../gases/Gases';
import { Segments } from '../depths/Segments';
import { StandardGases } from '../gases/StandardGases';
import { Salinity } from '../physics/pressure-converter';
import { Time } from '../physics/Time';

describe('Buhlmann Algorithm - pSCR', () => {
    const algorithm = new BuhlmannAlgorithm();
    const options = OptionExtensions.createOptions(0.4, 0.85, 1.4, 1.6, Salinity.fresh);
    const rebreather = new RebreatherOptions(CircuitType.pscr);
    const pscr = new PscrBreathing(rebreather, 20, new DepthConverterFactory(options).create());

    const planDuration = (gas: Gas, breathing?: BreathingModel): number => {
        const segments = new Segments();
        segments.add(30, gas, Time.oneMinute * 2);
        segments.addFlat(gas, Time.oneMinute * 28);
        const gases = new Gases();
        gases.add(gas);
        const params = AlgorithmParams.forMultilevelDive(segments, gases, options, undefined, breathing);
        return Segments.duration(algorithm.decompression(params).segments);
    };

    it('needs longer decompression than open circuit on the same supply gas', () => {
        expect(planDuration(StandardGases.ean32, pscr)).toBeGreaterThan(planDuration(StandardGases.ean32));
    });

    it('loop gets leaner during ascent, so the profile ends on the supply gas tank', () => {
        const segments = new Segments();
        segments.add(30, StandardGases.ean32, Time.oneMinute * 2);
        segments.addFlat(StandardGases.ean32, Time.oneMinute * 28);
        const gases = new Gases();
        gases.add(StandardGases.ean32);
        const params = AlgorithmParams.forMultilevelDive(segments, gases, options, undefined, pscr);
        const profile = algorithm.decompression(params).segments;
        const last = profile[profile.length - 1];
        // segments keep the supply gas, the loop gas is only used for tissues loading
        expect(last.gas.compositionEquals(StandardGases.ean32)).toBeTrue();
        expect(last.endDepth).toBe(0);
    });
});
