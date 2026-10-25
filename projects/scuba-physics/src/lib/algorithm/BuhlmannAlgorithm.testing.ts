import { BuhlmannAlgorithm } from './BuhlmannAlgorithm';
import { Gases } from '../gases/Gases';
import { Segment, Segments } from '../depths/Segments';
import { OptionExtensions } from './Options.testing';
import { Options } from './Options';
import { AlgorithmParams } from './BuhlmannAlgorithmParameters';

export function calculatePlanFor(gases: Gases, source: Segments, options: Options): Segment[] {
    const algorithm = new BuhlmannAlgorithm();
    const parameters = AlgorithmParams.forMultilevelDive(source, gases, options, OptionExtensions.openCircuit(options));
    const decoPlan = algorithm.decompression(parameters);
    return decoPlan.segments;
}
