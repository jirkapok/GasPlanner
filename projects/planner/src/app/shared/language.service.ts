import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PreferencesStore } from './preferencesStore';
import { AppPreferences } from './serialization.model';

export interface LanguageOption {
    code: string;
    nativeName: string;
    /** ISO 3166-1 alpha-2 country code used as the `flag-icons` CSS class suffix (`fi-<countryCode>`). */
    countryCode: string;
}

@Injectable()
export class LanguageService {
    public readonly languages: LanguageOption[] = [
        { code: 'en', nativeName: 'English', countryCode: 'gb' },
        { code: 'de', nativeName: 'Deutsch', countryCode: 'de' },
        { code: 'cs', nativeName: 'Čeština', countryCode: 'cz' },
        { code: 'es', nativeName: 'Español', countryCode: 'es' },
        { code: 'fr', nativeName: 'Français', countryCode: 'fr' },
        { code: 'ru', nativeName: 'Русский', countryCode: 'ru' },
        { code: 'zh', nativeName: '简体中文', countryCode: 'cn' },
    ];

    private static readonly defaultCode = 'en';
    private static readonly manifestLinkId = 'app-manifest';
    private static readonly htmlLangByCode: Record<string, string> = {
        zh: 'zh-Hans'
    };

    /**
     * TranslateService.use() only updates its own currentLang signal once the target
     * language's translations finish loading (asynchronous for the real HTTP loader), so
     * callers that need the just-requested code synchronously (e.g. to persist it right
     * after switching) can't rely on translate.currentLang() - track it here instead.
     */
    private _currentLanguage = LanguageService.defaultCode;

    constructor(private translate: TranslateService) {
        this.translate.addLangs(this.languages.map(l => l.code));
    }

    public get currentLanguage(): string {
        return this._currentLanguage;
    }

    public async ready(): Promise<void> {
        const code = this.resolveInitialLanguage();
        this._currentLanguage = code;
        await firstValueFrom(this.translate.use(code));
        this.applyDomAndManifest(code);
    }

    /**
     * Only updates translation/DOM state. Persisting the choice into AppOptionsDto.language
     * happens via the normal Preferences.save() flow (see Preferences.toAppSettings()),
     * triggered by the caller - this service can't depend on PreferencesStore/Preferences
     * itself, since those depend back on this service to read/apply the stored language.
     */
    public setLanguage(code: string): void {
        if (!this.languages.some(l => l.code === code)) {
            return;
        }

        this._currentLanguage = code;
        this.translate.use(code);
        this.applyDomAndManifest(code);
    }

    private resolveInitialLanguage(): string {
        const stored = this.readStoredLanguage();
        if (stored && this.languages.some(l => l.code === stored)) {
            return stored;
        }

        const browserCode = (navigator.language || '').slice(0, 2).toLowerCase();
        const matched = this.languages.find(l => l.code === browserCode);
        return matched ? matched.code : LanguageService.defaultCode;
    }

    /**
     * Reads AppOptionsDto.language directly out of the same 'preferences' storage PreferencesStore
     * uses, since PreferencesStore.load() (which normally applies it) only runs later, once the
     * rest of the app's dependency graph (ManagedDiveSchedules etc.) is constructed - after this
     * service's ready() must already have resolved during app initialization.
     */
    private readStoredLanguage(): string | undefined {
        const raw = localStorage.getItem(PreferencesStore.storageKey);
        if (!raw) {
            return undefined;
        }

        try {
            return (JSON.parse(raw) as AppPreferences).options?.language;
        } catch {
            return undefined;
        }
    }

    private applyDomAndManifest(code: string): void {
        document.documentElement.lang = LanguageService.htmlLangByCode[code] || code;

        const manifestLink = document.getElementById(LanguageService.manifestLinkId) as HTMLLinkElement | null;
        if (manifestLink) {
            manifestLink.href = code === LanguageService.defaultCode
                ? 'manifest.webmanifest'
                : `manifest.${code}.webmanifest`;
        }
    }
}
