import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import {
    AppOptionsDto,
    AppPreferences, AppPreferencesDto, AppStates, DiveDto, DtoSerialization, ITankBound
} from './serialization.model';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';

export class PreferencesFactory {
    public toPreferences(
        tanksService: TanksService,
        targetOptions: OptionsService,
        viewSwitch: ViewSwitchService,
        plan: Plan): AppPreferences {
        return {
            states: this.toStates(),
            options: this.toAppSettings(viewSwitch),
            dives: this.toDives(targetOptions, tanksService, plan)
        };
    }

    public applyApp(
        tanksService: TanksService,
        targetOptions: OptionsService,
        viewSwitch: ViewSwitchService,
        targetPlan: Plan,
        loaded: AppPreferences): void {
        this.applyLoaded(tanksService, targetOptions, viewSwitch, targetPlan, loaded);
        this.applyStates();
    }

    public applyLoaded(
        tanksService: TanksService,
        targetOptions: OptionsService,
        viewSwitch: ViewSwitchService,
        targetPlan: Plan,
        loaded: AppPreferencesDto): void {
        this.applyDives(tanksService, targetOptions, targetPlan, loaded);
        // switch after data load fixes simple view valid data
        this.applyAppSettings(viewSwitch, loaded);
        // TODO consider use normalization service to fix data out of values
    }

    private toAppSettings(viewSwitch: ViewSwitchService): AppOptionsDto {
        return {
            imperialUnits: false, // TODO imperial units
            isComplex: viewSwitch.isComplex,
            language: 'en'
        };
    }

    private applyAppSettings(viewSwitch: ViewSwitchService, loaded: AppPreferencesDto): void {
        viewSwitch.isComplex = loaded.options.isComplex;
        // TODO imperial units
    }

    private toDives(targetOptions: OptionsService, tanksService: TanksService, plan: Plan): DiveDto[] {
        return [{
            options: DtoSerialization.fromOptions(targetOptions.getOptions()),
            diver: DtoSerialization.fromDiver(targetOptions.diver),
            tanks: DtoSerialization.fromTanks(tanksService.tanks as ITankBound[]),
            plan: DtoSerialization.fromSegments(plan.segments),
        }];
    }

    private applyDives(tanksService: TanksService,
        targetOptions: OptionsService,
        targetPlan: Plan,
        loaded: AppPreferencesDto): void {
        const firstDive = loaded.dives[0];
        const tanks = DtoSerialization.toTanks(firstDive.tanks);
        const segments = DtoSerialization.toSegments(firstDive.plan, tanks);
        const diver = DtoSerialization.toDiver(firstDive.diver);
        const options = DtoSerialization.toOptions(firstDive.options);
        tanksService.loadFrom(tanks);
        DtoSerialization.loadWorkingPressure(firstDive.tanks, tanksService.tanks);
        targetOptions.loadFrom(options, diver);
        targetPlan.loadFrom(segments);
    }

    private toStates(): AppStates {
        // not implemented yet
        return {
            lastScreen: '/',
            state: {}
        };
    }

    private applyStates(): void {
        // not implemented yet
    }
}
