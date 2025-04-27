import { Injectable } from '@angular/core';
import { Preferences } from './preferences';
import { AppPreferences, DiveDto, QuizAnswerStats } from './serialization.model';
import { DiveSchedule } from './dive.schedules';

@Injectable()
export class PreferencesStore {
    private static readonly disclaimerValue = 'confirmed';
    private static readonly storageKey = 'preferences';
    private static readonly storageDefaultsKey = 'defaults';
    private static readonly disclaimerKey = 'disclaimer';
    private static readonly showInstallKey = 'showInstall';

    public quizAnswers: Record<string, QuizAnswerStats> = {};

    constructor(private preferencesFactory: Preferences) {}

    public load(): void {
        const toParse = localStorage.getItem(PreferencesStore.storageKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as AppPreferences;
        this.preferencesFactory.applyApp(loaded);

        if (loaded.quizAnswers) {
            this.quizAnswers = loaded.quizAnswers;
        }
    }

    public loadDefault(dive: DiveSchedule): void {
        const toParse = localStorage.getItem(PreferencesStore.storageDefaultsKey);
        if (!toParse) {
            return;
        }

        const loaded = JSON.parse(toParse) as DiveDto;

        if (loaded) {
            this.preferencesFactory.loadDive(dive, loaded);
        }
    }

    public loadFrom(from: DiveSchedule, to: DiveSchedule): void {
        const source = this.preferencesFactory.toDiveFrom(from);
        this.preferencesFactory.loadDive(to, source);
    }

    public save(): void {
        const toSave = this.preferencesFactory.toPreferences();

        if (this.quizAnswers) {
            toSave.quizAnswers = this.quizAnswers;
        }

        const serialized = JSON.stringify(toSave);
        localStorage.setItem(PreferencesStore.storageKey, serialized);
    }

    public saveDefault(): void {
        const toSave = this.preferencesFactory.toDive();
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

    public disableShowInstall(): void {
        localStorage.setItem(PreferencesStore.showInstallKey, PreferencesStore.disclaimerValue);
    }

    public installEnabled(): boolean {
        const saved = localStorage.getItem(PreferencesStore.showInstallKey);
        return saved !== PreferencesStore.disclaimerValue;
    }
}
