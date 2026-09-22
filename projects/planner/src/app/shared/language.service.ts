import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PreferencesStore } from './preferencesStore';

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

    constructor(private translate: TranslateService, private preferences: PreferencesStore) {
        this.translate.addLangs(this.languages.map(l => l.code));
    }

    public get currentLanguage(): string {
        return this.translate.currentLang() || LanguageService.defaultCode;
    }

    public async ready(): Promise<void> {
        const code = this.resolveInitialLanguage();
        await firstValueFrom(this.translate.use(code));
        this.applyDomAndManifest(code);
    }

    public setLanguage(code: string): void {
        if (!this.languages.some(l => l.code === code)) {
            return;
        }

        this.translate.use(code);
        this.preferences.setLanguage(code);
        this.applyDomAndManifest(code);
    }

    private resolveInitialLanguage(): string {
        const stored = this.preferences.getLanguage();
        if (stored && this.languages.some(l => l.code === stored)) {
            return stored;
        }

        const browserCode = (navigator.language || '').slice(0, 2).toLowerCase();
        const matched = this.languages.find(l => l.code === browserCode);
        return matched ? matched.code : LanguageService.defaultCode;
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
