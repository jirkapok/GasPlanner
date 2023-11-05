import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';
import { Preferences } from './preferences';
import { AppPreferences, DiveDto } from './serialization.model';
import {DiveSchedule} from './dive.schedules';

@Injectable()
export class PreferencesStore {
    private static readonly disclaimerValue = 'confirmed';
    private static readonly storageKey = 'preferences';
    private static readonly storageDefaultsKey = 'defaults';
    private static readonly disclaimerKey = 'disclaimer';

    constructor(
        private planner: PlannerService,
        private preferencesFactory: Preferences) {}

    public load(): void {
        const toParse = localStorage.getItem(PreferencesStore.storageKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as AppPreferences;
        this.preferencesFactory.applyApp(loaded);
        this.planner.calculate();
    }

    public loadDefault(): void {
        const toParse = localStorage.getItem(PreferencesStore.storageDefaultsKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as DiveDto;
        this.preferencesFactory.loadDive(loaded);
        this.planner.calculate();
    }

    // TODO replace loadDefault by loadDefaultTo
    public loadDefaultTo(current: DiveSchedule): void {
        const toParse = localStorage.getItem(PreferencesStore.storageDefaultsKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as DiveDto;

        if(loaded) {
            this.preferencesFactory.loadTo(current, loaded);
        }

        return this.preferencesFactory.loadDive(loaded);
    }

    public save(): void {
        const toSave = this.preferencesFactory.toPreferences();
        const serialized = JSON.stringify(toSave);
        localStorage.setItem(PreferencesStore.storageKey, serialized);
    }

    // TODO replace saveDefault by saveDefaultFroms
    public saveDefault(): void {
        const toSave = this.preferencesFactory.toDive();
        const serialized = JSON.stringify(toSave);
        localStorage.setItem(PreferencesStore.storageDefaultsKey, serialized);
    }

    public saveDefaultFrom(current: DiveSchedule): void {
        const toSave = this.preferencesFactory.toDiveFrom(current);
        const serialized = JSON.stringify(toSave);
        localStorage.setItem(PreferencesStore.storageDefaultsKey, serialized);
    }

    public disableDisclaimer(): void {
        localStorage.setItem(PreferencesStore.disclaimerKey, PreferencesStore.disclaimerValue);
    }

    public disclaimerEnabled(): boolean {
        const saved = localStorage.getItem(PreferencesStore.disclaimerKey);
        return saved !== PreferencesStore.disclaimerValue;
    }
}
