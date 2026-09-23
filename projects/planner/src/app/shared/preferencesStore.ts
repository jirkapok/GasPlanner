import { Injectable } from '@angular/core';
import { Preferences } from './preferences';
import { AppPreferences, DiveDto } from './serialization.model';
import { DiveSchedule } from './dive.schedules';

@Injectable()
export class PreferencesStore {
    private static readonly storageKey = 'preferences';
    private static readonly disclaimerValue = 'confirmed';
    private static readonly storageDefaultsKey = 'defaults';
    private static readonly disclaimerKey = 'disclaimer';
    private static readonly showInstallKey = 'showInstall';
    private static readonly quizShownKey = 'quizShown';
    private static readonly confirmedValue = 'confirmed';

    constructor(private preferences: Preferences) {}

    public load(): void {
        const toParse = localStorage.getItem(PreferencesStore.storageKey);
        if (!toParse) {
            return;
        }

        const raw = JSON.parse(toParse) as AppPreferences;
        this.preferences.applyApp(raw);
    }

    public loadDefault(dive: DiveSchedule): void {
        const toParse = localStorage.getItem(PreferencesStore.storageDefaultsKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as DiveDto;

        if (loaded) {
            this.preferences.loadDive(dive, loaded);
        }
    }

    public loadFrom(from: DiveSchedule, to: DiveSchedule): void {
        const source = this.preferences.toDiveFrom(from);
        this.preferences.loadDive(to, source);
    }

    public save(): void {
        const toSave = this.preferences.toPreferences();

        const serialized = JSON.stringify(toSave);
        localStorage.setItem(PreferencesStore.storageKey, serialized);
    }

    public saveDefault(): void {
        const toSave = this.preferences.toDive();
        const serialized = JSON.stringify(toSave);
        localStorage.setItem(PreferencesStore.storageDefaultsKey, serialized);
    }

    public ensureDefault(): void {
        const toParse = localStorage.getItem(PreferencesStore.storageDefaultsKey);
        if (!toParse) {
            this.saveDefault();
        }
    }

    public disableDisclaimer(): void {
        localStorage.setItem(PreferencesStore.disclaimerKey, PreferencesStore.disclaimerValue);
    }

    public disclaimerEnabled(): boolean {
        const saved = localStorage.getItem(PreferencesStore.disclaimerKey);
        return saved !== PreferencesStore.disclaimerValue;
    }

    public quizWelcomeEnabled(): boolean {
        const saved = localStorage.getItem(PreferencesStore.quizShownKey);
        return saved !== PreferencesStore.confirmedValue;
    }

    public disableQuizWelcome(): void {
        localStorage.setItem(PreferencesStore.quizShownKey, PreferencesStore.confirmedValue);
    }

    public disableShowInstall(): void {
        localStorage.setItem(PreferencesStore.showInstallKey, PreferencesStore.disclaimerValue);
    }

    public installEnabled(): boolean {
        const saved = localStorage.getItem(PreferencesStore.showInstallKey);
        return saved !== PreferencesStore.disclaimerValue;
    }
}
