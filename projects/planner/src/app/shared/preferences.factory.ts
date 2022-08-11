import { OptionsDispatcherService } from './options-dispatcher.service';
import { PlannerService } from './planner.service';
import { AppPreferences, DtoSerialization } from './serialization.model';

export class PreferencesFactory {
    public toPreferences(planner: PlannerService, targetOptions: OptionsDispatcherService): AppPreferences {
        return {
            isComplex: planner.isComplex,
            options: DtoSerialization.fromOptions(targetOptions.getOptions()),
            diver: DtoSerialization.fromDiver(planner.diver),
            tanks: DtoSerialization.fromTanks(planner.tanks),
            plan: DtoSerialization.fromSegments(planner.plan.segments),
        };
    }

    public applyLoaded(target: PlannerService, targetOptions: OptionsDispatcherService, loaded: AppPreferences): void {
        const tanks = DtoSerialization.toTanks(loaded.tanks);
        const segments = DtoSerialization.toSegments(loaded.plan, tanks);
        const diver = DtoSerialization.toDiver(loaded.diver);
        const options = DtoSerialization.toOptions(loaded.options);
        targetOptions.loadFrom(options);

        if(!loaded.isComplex) {
            targetOptions.resetToSimple();
        }

        target.loadFrom(loaded.isComplex, options, diver, tanks, segments);
        target.calculate();
    }
}
