import { Injectable } from '@angular/core';
import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import {
    AppOptionsDto, AppPreferences, AppPreferencesDto,
    AppStates, DiveDto, ITankBound
} from './serialization.model';
import { DtoSerialization } from './dtoSerialization';

import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ViewSwitchService } from './viewSwitchService';
import { ViewStates } from './viewStates';
import {DiveSetup} from './models';

@Injectable()
export class Preferences {
    constructor(
        private viewSwitch: ViewSwitchService,
        private units: UnitConversion,
        private tanksService: TanksService,
        private plan: Plan,
        private options: OptionsService,
        private viewStates: ViewStates
    ) { }

    public toPreferences(): AppPreferences {
        return {
            states: this.toStates(),
            options: this.toAppSettings(this.viewSwitch),
            dives: this.toDives()
        };
    }

    public applyApp(loaded: AppPreferences): void {
        this.applyLoaded(loaded);
        this.viewStates.loadFrom(loaded.states);
    }

    public applyLoaded(loaded: AppPreferencesDto): void {
        // first apply units to prevent loading of invalid values
        this.units.imperialUnits = loaded.options.imperialUnits;
        this.applyDives(loaded);
        // now we are able to switch the view
        this.viewSwitch.isComplex = loaded.options.isComplex;
        // not using normalization to fix values here, because expecting they are valid
    }

    public toDive(): DiveDto {
        return {
            options: DtoSerialization.fromOptions(this.options.getOptions()),
            diver: DtoSerialization.fromDiver(this.options.getDiver()),
            tanks: DtoSerialization.fromTanks(this.tanksService.tanks as ITankBound[]),
            plan: DtoSerialization.fromSegments(this.plan.segments),
        };
    }

    public loadDive(loadedDive: DiveDto): DiveSetup {
        const tanks = DtoSerialization.toTanks(loadedDive.tanks);
        const segments = DtoSerialization.toSegments(loadedDive.plan, tanks);
        const diver = DtoSerialization.toDiver(loadedDive.diver);
        const options = DtoSerialization.toOptions(loadedDive.options);
        this.tanksService.loadFrom(tanks);
        DtoSerialization.loadWorkingPressure(loadedDive.tanks, this.tanksService.tanks);
        this.options.loadFrom(options, diver);
        this.plan.loadFrom(segments);

        return {
            diver: diver,
            options: options,
            tanks: tanks,
            segments: segments
        };
    }

    private toAppSettings(viewSwitch: ViewSwitchService): AppOptionsDto {
        return {
            imperialUnits: this.units.imperialUnits,
            isComplex: viewSwitch.isComplex,
            language: 'en'
        };
    }

    private toDives(): DiveDto[] {
        return [
            this.toDive()
        ];
    }

    private applyDives(loaded: AppPreferencesDto): void {
        const firstDive = loaded.dives[0];
        this.loadDive(firstDive);
    }

    private toStates(): AppStates {
        return {
            lastScreen: this.viewStates.lastView,
            states: this.viewStates.all
        };
    }
}
