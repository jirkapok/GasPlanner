import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import { PlannerService } from './planner.service';
import { AppPreferences, DtoSerialization, ITankBound } from './serialization.model';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';

export class PreferencesFactory {
    public toPreferences(planner: PlannerService,
        tanksService: TanksService,
        targetOptions: OptionsService,
        viewSwitch: ViewSwitchService,
        plan: Plan): AppPreferences {
        return {
            isComplex: viewSwitch.isComplex,
            options: DtoSerialization.fromOptions(targetOptions.getOptions()),
            diver: DtoSerialization.fromDiver(targetOptions.diver),
            tanks: DtoSerialization.fromTanks(tanksService.tanks as ITankBound[]),
            plan: DtoSerialization.fromSegments(plan.segments),
        };
    }

    public applyLoaded(target: PlannerService,
        tanksService: TanksService,
        targetOptions: OptionsService,
        viewSwitch: ViewSwitchService,
        targetPlan: Plan,
        loaded: AppPreferences): void {
        const tanks = DtoSerialization.toTanks(loaded.tanks);
        const segments = DtoSerialization.toSegments(loaded.plan, tanks);
        const diver = DtoSerialization.toDiver(loaded.diver);
        const options = DtoSerialization.toOptions(loaded.options);
        tanksService.loadFrom(tanks);
        DtoSerialization.loadWorkingPressure(loaded.tanks, tanksService.tanks);
        targetOptions.loadFrom(options, diver);
        targetPlan.loadFrom(segments);
        target.loadFrom(options, diver);
        viewSwitch.isComplex = loaded.isComplex;
        target.calculate();
    }
}
