import { Injectable } from '@angular/core';
import { OptionsService } from './options-dispatcher.service';
import { Plan } from './plan.service';
import { PlannerService } from './planner.service';
import { PreferencesFactory } from './preferences.factory';
import { AppPreferences } from './serialization.model';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';

@Injectable()
export class PreferencesService {
    private static readonly disclaimerValue = 'confirmed';
    private static readonly storageKey = 'preferences';
    private static readonly disclaimerKey = 'disclaimer';
    private preferencesFactory = new PreferencesFactory();

    constructor(private planner: PlannerService,
        private tanksService: TanksService,
        private viewSwitch: ViewSwitchService,
        private options: OptionsService,
        private plan: Plan) { }

    public loadDefaults(): void {
        const toParse = localStorage.getItem(PreferencesService.storageKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as AppPreferences;
        this.preferencesFactory.applyLoaded(this.planner, this.tanksService,
            this.options, this.viewSwitch, this.plan, loaded);
    }

    public saveDefaults(): void {
        const toSave = this.preferencesFactory.toPreferences(this.planner,
            this.tanksService, this.options, this.viewSwitch, this.plan);
        const serialized = JSON.stringify(toSave);
        localStorage.setItem(PreferencesService.storageKey, serialized);
    }

    public disableDisclaimer(): void {
        localStorage.setItem(PreferencesService.disclaimerKey, PreferencesService.disclaimerValue);
    }

    public disclaimerEnabled(): boolean {
        const saved = localStorage.getItem(PreferencesService.disclaimerKey);
        return saved !== PreferencesService.disclaimerValue;
    }
}
