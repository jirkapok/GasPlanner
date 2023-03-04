import { OptionsDispatcherService } from './options-dispatcher.service';
import { Plan } from './plan.service';
import { PlannerService } from './planner.service';
import { AppPreferences, DtoSerialization } from './serialization.model';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';

export class PreferencesFactory {
    public toPreferences(planner: PlannerService,
        tanksService: TanksService,
        targetOptions: OptionsDispatcherService,
        viewSwitch: ViewSwitchService,
        plan: Plan): AppPreferences {
        return {
            isComplex: viewSwitch.isComplex,
            options: DtoSerialization.fromOptions(targetOptions.getOptions()),
            diver: DtoSerialization.fromDiver(planner.diver),
            tanks: DtoSerialization.fromTanks(tanksService.tankData),
            plan: DtoSerialization.fromSegments(plan.segments),
        };
    }

    public applyLoaded(target: PlannerService,
        tanksService: TanksService,
        targetOptions: OptionsDispatcherService,
        viewSwitch: ViewSwitchService,
        targetPlan: Plan,
        loaded: AppPreferences): void {
        const tanks = DtoSerialization.toTanks(loaded.tanks);
        const segments = DtoSerialization.toSegments(loaded.plan, tanks);
        const diver = DtoSerialization.toDiver(loaded.diver);
        const options = DtoSerialization.toOptions(loaded.options);
        tanksService.loadFrom(tanks);
        targetOptions.loadFrom(options);
        targetPlan.loadFrom(segments);
        target.loadFrom(options, diver, segments);
        viewSwitch.isComplex = loaded.isComplex;
        target.calculate();
    }
}
