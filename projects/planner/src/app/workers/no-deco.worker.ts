/// <reference lib="webworker" />

import { BuhlmannAlgorithm, Gases, Segments } from 'scuba-physics';
import { DtoSerialization, NoDecoRequestDto } from '../shared/serialization.model';

addEventListener('message', ({ data }) => {
    const response = NoDecoTask.noDecoTime(data);
    postMessage(response);
});


class NoDecoTask {
    public static noDecoTime(task: NoDecoRequestDto): number {
        // we can't speedup the prediction from already obtained profile,
        // since it may happen, the deco starts during ascent.
        // we cant use the maxDepth, because its purpose is only for single level dives
        const tanks = DtoSerialization.toTanks(task.tanks);
        const gases = Gases.fromTanks(tanks);
        const originProfile = DtoSerialization.toSegments(task.originProfile, tanks);
        const segments = Segments.fromCollection(originProfile);
        const algorithm = new BuhlmannAlgorithm();
        const noDecoLimit = algorithm.noDecoLimitMultiLevel(segments, gases, task.options);
        return noDecoLimit;
    }
}
