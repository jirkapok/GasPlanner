/// <reference lib="webworker" />

import { BuhlmannAlgorithm, CalculatedProfile, Gases, Options, ProfileEvents, Segments, Tank } from 'scuba-physics';
import { DtoSerialization } from '../shared/serialization.model';

addEventListener('message', ({ data }) => {
    const tanks = DtoSerialization.toTanks(data.tanks);
    const segments = DtoSerialization.toSegments(data.plan, tanks);
    const plan = Segments.fromCollection(segments);
    const profile = ProfileTask.calculateDecompression(plan, tanks, data.options);
    const events = ProfileEvents.fromProfile(plan.startAscentIndex, segments, profile.ceilings, data.options);
    const profileDto = DtoSerialization.fromProfile(profile);
    // TODO fix errors usage present in WaypointService
    const result = {
        profile: profileDto,
        events
    };
    postMessage(result);
});


class ProfileTask {
    public static calculateDecompression(segments: Segments, tanks: Tank[], options: Options): CalculatedProfile {
        const gases = Gases.fromTanks(tanks);
        const algorithm = new BuhlmannAlgorithm();
        const profile = algorithm.calculateDecompression(options, gases, segments);
        return profile;
    }
}
