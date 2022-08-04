import { PlannerService } from './planner.service';
import { AppPreferences, DtoSerialization } from './serialization.model';

export class PreferencesFactory {
    public static toPreferences(planner: PlannerService): AppPreferences {
        return {
            isComplex: planner.isComplex,
            options: DtoSerialization.fromOptions(planner.options),
            diver: DtoSerialization.fromDiver(planner.diver),
            tanks: DtoSerialization.fromTanks(planner.tanks),
            plan: DtoSerialization.fromSegments(planner.plan.segments),
        };
    }

    public static applyLoaded(target: PlannerService, loaded: AppPreferences): void {
        const tanks = DtoSerialization.toTanks(loaded.tanks);
        const segments = DtoSerialization.toSegments(loaded.plan, tanks);
        const diver = DtoSerialization.toDiver(loaded.diver);
        const options = DtoSerialization.toOptions(loaded.options);
        target.loadFrom(loaded.isComplex, options, diver, tanks, segments);
    }
}
