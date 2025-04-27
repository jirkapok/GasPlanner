import { Injectable } from '@angular/core';
import _ from 'lodash';
import {
    AppOptionsDto, AppPreferences, AppPreferencesDto,
    AppStates, DiveDto, ITankBound, QuizAnswerStats, TankDto
} from './serialization.model';
import { DtoSerialization } from './dtoSerialization';
import { UnitConversion } from './UnitConversion';
import { ViewSwitchService } from './viewSwitchService';
import { KnownViews, ViewStates } from './viewStates';
import { DiveSetup } from './models';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { DashBoardViewState } from './views.model';
import { ApplicationSettingsService } from './ApplicationSettings';
import { QuizService } from './learn/quiz.service';

@Injectable()
export class Preferences {
    constructor(
        private viewSwitch: ViewSwitchService,
        private units: UnitConversion,
        private schedules: DiveSchedules,
        private appSettings: ApplicationSettingsService,
        private viewStates: ViewStates,
        private quizService: QuizService
    ) { }

    private static loadWorkingPressure(source: TankDto[], target: ITankBound[]): void {
        for (let index = 0; index < target.length; index++) {
            const loadedWorkingPressure = source[index].workPressure;

            // to prevent load 0 in imperial units, for metrics, 0 is default anyway
            if(loadedWorkingPressure > 0) {
                target[index].workingPressureBars = loadedWorkingPressure;
            }
        }
    }

    public toPreferences(): AppPreferences {
        return {
            states: this.toStates(),
            options: this.toAppSettings(),
            dives: this.toDives()
        };
    }

    public applyApp(loaded: AppPreferences): void {
        this.applyLoaded(loaded);
        this.viewStates.loadFrom(loaded.states);
        const mainView: DashBoardViewState | null = this.viewStates.get(KnownViews.dashboard);

        if(mainView) {
            this.schedules.setSelectedIndex(mainView.selectedDiveIndex);
        }
    }

    public toDive(): DiveDto {
        return this.toDiveFrom(this.schedules.selected);
    }

    public loadDive(diveSchedule: DiveSchedule, loadedDive: DiveDto): void {
        const setup = this.toDiveSetup(loadedDive);
        diveSchedule.optionsService.loadFrom(setup.options, setup.diver);
        diveSchedule.tanksService.loadFrom(setup.tanks);
        Preferences.loadWorkingPressure(loadedDive.tanks, diveSchedule.tanksService.tanks);
        diveSchedule.depths.loadFrom(setup.segments);

        if(loadedDive.surfaceInterval) {
            diveSchedule.surfaceInterval = loadedDive.surfaceInterval;
        }
    }

    public addLoaded(loaded: DiveDto): DiveSchedule {
        const added = this.schedules.add();
        this.loadDive(added, loaded);
        return added;
    }

    private applyLoaded(loaded: AppPreferencesDto): void {
        // first apply units to prevent loading of invalid values
        this.units.imperialUnits = loaded.options.imperialUnits;
        this.applyDives(loaded.dives);
        this.appSettings.loadFrom(loaded.options);

        // now we are able to switch the view
        this.viewSwitch.isComplex = loaded.options.isComplex;
        // not using normalization to fix values here, because expecting they are valid
    }

    private applyDives(loaded: DiveDto[]): void {
        if(loaded.length > 0) {
            // consider better way than rebuild dives from scratch
            this.schedules.clear();
            this.loadDive(this.schedules.dives[0], loaded[0]);

            for (let index = 1; index < loaded.length; index++) {
                this.addLoaded(loaded[index]);
            }
        }
    }

    private toDiveSetup(loadedDive: DiveDto): DiveSetup {
        const tanks = DtoSerialization.toTanks(loadedDive.tanks);
        return {
            diver: DtoSerialization.toDiver(loadedDive.diver),
            options: DtoSerialization.toOptions(loadedDive.options),
            tanks: tanks,
            segments: DtoSerialization.toSegments(loadedDive.plan, tanks)
        };
    }

    private toAppSettings(): AppOptionsDto {
        const settings = this.appSettings.settings;
        return {
            imperialUnits: this.units.imperialUnits,
            isComplex: this.viewSwitch.isComplex,
            language: 'en',
            maxDensity: settings.maxGasDensity,
            primaryTankReserve: settings.primaryTankReserve,
            stageTankReserve: settings.stageTankReserve,
            icdIgnored: settings.icdIgnored,
            densityIgnored: settings.densityIgnored,
            noDecoIgnored: settings.noDecoIgnored,
            missingAirBreakIgnored: settings.missingAirBreakIgnored
        };
    }

    public toDiveFrom(dive: DiveSchedule): DiveDto {
        const surfaceInterval = dive.isRepetitive ? dive.surfaceInterval : undefined;
        return {
            options: DtoSerialization.fromOptions(dive.optionsService.getOptions()),
            diver: DtoSerialization.fromDiver(dive.optionsService.getDiver()),
            tanks: DtoSerialization.fromTanks(dive.tanksService.tanks as ITankBound[]),
            plan: DtoSerialization.fromSegments(dive.depths.segments),
            surfaceInterval: surfaceInterval
        };
    }

    private toDives(): DiveDto[] {
        return _(this.schedules.dives)
            .map(d => this.toDiveFrom(d))
            .value();
    }

    private toStates(): AppStates {
        return {
            lastScreen: this.viewStates.lastView,
            states: this.viewStates.all
        };
    }
}
