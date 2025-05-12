import { Injectable } from '@angular/core';
import { Preferences } from './preferences';
import { AppPreferences, DiveDto, QuizAnswerStats } from './serialization.model';
import { DiveSchedule } from './dive.schedules';

type SerializableAppPreferences = Omit<AppPreferences, 'quizAnswers'> & {
    quizAnswers: [string, QuizAnswerStats][] | Record<string, QuizAnswerStats>;
};

@Injectable()
export class PreferencesStore {
    private static readonly disclaimerValue = 'confirmed';
    private static readonly storageKey = 'preferences';
    private static readonly storageDefaultsKey = 'defaults';
    private static readonly disclaimerKey = 'disclaimer';
    private static readonly showInstallKey = 'showInstall';

    constructor(private preferencesFactory: Preferences) {}

    public load(): void {
        const toParse = localStorage.getItem(PreferencesStore.storageKey);
        if (!toParse) {
            return;
        }

        const raw = JSON.parse(toParse) as SerializableAppPreferences;

        const quizAnswersRaw = raw.quizAnswers;
        const quizAnswersMap = Array.isArray(quizAnswersRaw)
            ? new Map<string, QuizAnswerStats>(quizAnswersRaw)
            : new Map<string, QuizAnswerStats>(Object.entries(quizAnswersRaw));

        const fixed: AppPreferences = {
            ...raw,
            quizAnswers: quizAnswersMap
        };

        this.preferencesFactory.applyApp(fixed);
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

        const serializable: SerializableAppPreferences = {
            ...toSave,
            quizAnswers: [...toSave.quizAnswers.entries()]
        };

        const serialized = JSON.stringify(serializable);
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
