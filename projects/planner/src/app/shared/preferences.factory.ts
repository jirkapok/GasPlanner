import { Injectable } from '@angular/core';
import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import {
    AppOptionsDto,
    AppPreferences, AppPreferencesDto, AppStates, DiveDto, DtoSerialization, ITankBound
} from './serialization.model';
import { SettingsNormalizationService } from './settings-normalization.service';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ViewSwitchService } from './viewSwitchService';

@Injectable()
export class PreferencesFactory {
    constructor(
        private viewSwitch: ViewSwitchService,
        private units: UnitConversion,
        private tanksService: TanksService,
        private plan: Plan,
        private options: OptionsService,
        private normalization: SettingsNormalizationService
    ){}

    public toPreferences(): AppPreferences {
        return {
            states: this.toStates(),
            options: this.toAppSettings(this.viewSwitch),
            dives: this.toDives()
        };
    }

    public applyApp(loaded: AppPreferences): void {
        this.applyLoaded(loaded);
        this.applyStates();
    }

    public applyLoaded(loaded: AppPreferencesDto): void {
        this.applyDives(loaded);
        this.applyAppSettings(loaded);
    }

    private toAppSettings(viewSwitch: ViewSwitchService): AppOptionsDto {
        return {
            imperialUnits: this.units.imperialUnits,
            isComplex: viewSwitch.isComplex,
            language: 'en'
        };
    }

    private applyAppSettings(loaded: AppPreferencesDto): void {
        this.viewSwitch.isComplex = loaded.options.isComplex;
        this.units.imperialUnits = loaded.options.imperialUnits;
        // not using normalization to fix values here, because expecting they are valid
    }

    private toDives(): DiveDto[] {
        return [{
            options: DtoSerialization.fromOptions(this.options.getOptions()),
            diver: DtoSerialization.fromDiver(this.options.diver),
            tanks: DtoSerialization.fromTanks(this.tanksService.tanks as ITankBound[]),
            plan: DtoSerialization.fromSegments(this.plan.segments),
        }];
    }

    private applyDives(loaded: AppPreferencesDto): void {
        const firstDive = loaded.dives[0];
        const tanks = DtoSerialization.toTanks(firstDive.tanks);
        const segments = DtoSerialization.toSegments(firstDive.plan, tanks);
        const diver = DtoSerialization.toDiver(firstDive.diver);
        const options = DtoSerialization.toOptions(firstDive.options);
        this.tanksService.loadFrom(tanks);
        DtoSerialization.loadWorkingPressure(firstDive.tanks, this.tanksService.tanks);
        this.options.loadFrom(options, diver);
        this.plan.loadFrom(segments);
    }

    private toStates(): AppStates {
        // not implemented yet, restore last known app state. Used for pwa
        return {
            lastScreen: '/',
            state: {}
        };
    }

    private applyStates(): void {
        // not implemented yet
    }
}
