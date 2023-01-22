import { Injectable } from '@angular/core';
import { OptionsDispatcherService } from './options-dispatcher.service';
import { PlannerService } from './planner.service';
import { PreferencesFactory } from './preferences.factory';
import { AppPreferences } from './serialization.model';

@Injectable()
export class PreferencesService {
    private static readonly disclaimerValue = 'confirmed';
    private static readonly storageKey = 'preferences';
    private static readonly disclaimerKey = 'disclaimer';
    private preferencesFactory = new PreferencesFactory();

    constructor(private planner: PlannerService, private options: OptionsDispatcherService) { }

    public loadDefaults(): void {
        const toParse = localStorage.getItem(PreferencesService.storageKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as AppPreferences;
        this.preferencesFactory.applyLoaded(this.planner, this.options, loaded);
    }

    public saveDefaults(): void {
        const toSave = this.preferencesFactory.toPreferences(this.planner, this.options);
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
