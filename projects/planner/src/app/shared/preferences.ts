import { Injectable } from '@angular/core';
import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import {
    AppOptionsDto, AppPreferences, AppPreferencesDto,
    AppStates, DiveDto, ITankBound, TankDto
} from './serialization.model';
import { DtoSerialization } from './dtoSerialization';

import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { ViewSwitchService } from './viewSwitchService';
import { ViewStates } from './viewStates';
import {DiveSetup} from './models';
import {DiveSchedule} from './dive.schedules';
import _ from 'lodash';

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

    private static loadWorkingPressure(source: TankDto[], target: ITankBound[]): void {
        for (let index = 0; index < target.length; index++) {
            target[index].workingPressureBars = source[index].workPressure;
        }
    }

    public toPreferences(): AppPreferences {
        return {
            states: this.toStates(),
            options: this.toAppSettings(this.viewSwitch),
            dives: this.toDives()
        };
    }

    // TODO replace toPreferences by toPreferencesFrom
    public toPreferencesFrom(dives: DiveSchedule[]): AppPreferences {
        return {
            states: this.toStates(),
            options: this.toAppSettings(this.viewSwitch),
            dives: _(dives).map(d => this.toDiveFrom(d)).value()
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

    // TODO replace toDive by toDiveFrom
    public toDiveFrom(dive: DiveSchedule): DiveDto {
        return {
            options: DtoSerialization.fromOptions(dive.optionsService.getOptions()),
            diver: DtoSerialization.fromDiver(dive.optionsService.getDiver()),
            tanks: DtoSerialization.fromTanks(dive.tanksService.tanks as ITankBound[]),
            plan: DtoSerialization.fromSegments(dive.depths.segments),
        };
    }

    // TODO replace loadDive by loadTo
    public loadDive(loadedDive: DiveDto): void {
        const setup = this.toDiveSetup(loadedDive);
        this.tanksService.loadFrom(setup.tanks);
        Preferences.loadWorkingPressure(loadedDive.tanks, this.tanksService.tanks);
        this.options.loadFrom(setup.options, setup.diver);
        this.plan.loadFrom(setup.segments);
    }

    public loadTo(diveSchedule: DiveSchedule, loadedDive: DiveDto): void {
        const setup = this.toDiveSetup(loadedDive);
        diveSchedule.optionsService.loadFrom(setup.options, setup.diver);
        diveSchedule.tanksService.loadFrom(setup.tanks);
        Preferences.loadWorkingPressure(loadedDive.tanks, diveSchedule.tanksService.tanks);
        diveSchedule.depths.loadFrom(setup.segments);
    }

    private toDiveSetup(loadedDive: DiveDto): DiveSetup {
        const tanks = DtoSerialization.toTanks(loadedDive.tanks);
        const segments = DtoSerialization.toSegments(loadedDive.plan, tanks);
        const diver = DtoSerialization.toDiver(loadedDive.diver);
        const options = DtoSerialization.toOptions(loadedDive.options);
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
