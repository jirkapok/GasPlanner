import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';
import { PreferencesFactory } from './preferences.factory';
import { AppPreferences } from './serialization.model';

@Injectable({
    providedIn: 'root'
})
export class PreferencesService {
    private static readonly disclaimerValue = 'confirmed';
    private static readonly storageKey = 'preferences';
    private static readonly disclaimerKey = 'disclaimer';

    constructor(private planner: PlannerService) { }

    public loadDefaults(): void {
        const toParse = localStorage.getItem(PreferencesService.storageKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as AppPreferences;
        PreferencesFactory.applyLoaded(this.planner, loaded);
    }

    public saveDefaults(): void {
        const toSave = PreferencesFactory.toPreferences(this.planner);
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
