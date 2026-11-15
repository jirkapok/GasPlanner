import { LoadedTissues, ITankBound, PlanRequestDto, DtoSerialization } from 'scuba-physics';
import { DiveSchedule } from './dive.schedules';

/** Creates algorithm request of the dive, shared by planner and dive computer */
export class PlanRequestFactory {
    public static create(dive: DiveSchedule, previousTissues: LoadedTissues): PlanRequestDto {
        const serializableTanks = dive.tanksService.tanks as ITankBound[];
        return {
            diveId: dive.id,
            tanks: DtoSerialization.fromTanks(serializableTanks),
            plan: DtoSerialization.fromSegments(dive.depths.segments),
            options: DtoSerialization.fromOptions(dive.optionsService.getOptions()),
            diver: DtoSerialization.fromDiver(dive.optionsService.getDiver()),
            previousTissues: DtoSerialization.fromTissues(previousTissues),
            surfaceInterval: dive.surfaceInterval
        };
    }
}
