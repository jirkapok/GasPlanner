import { Injectable } from '@angular/core';
import { formatNumber } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PreferencesStore } from './preferencesStore';
import { AppPreferences } from './serialization.model';

export interface LanguageOption {
    code: string;
    nativeName: string;
    /** ISO 3166-1 alpha-2 country code. */
    countryCode: string;
}

// TODO localize:
// * quiz questions
// * plotly charts
// * consider in the future: documentation in doc directory
// Not localized on purpose: tank sizes and standard gas names come from the
// scuba-physics library, which must stay UI-agnostic (see CLAUDE.md).
@Injectable()
export class LanguageService {
    public readonly supportedLanguages: LanguageOption[] = [
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
    /** Maps our short app language codes to the BCP-47 locale ids registered via registerLocaleData. */
    private static readonly localeIdByCode: Record<string, string> = {
        zh: 'zh-Hans'
    };

    private _currentLanguage = LanguageService.defaultCode;

    constructor(private translate: TranslateService) {
        this.translate.addLangs(this.supportedLanguages.map(l => l.code));
    }

    public get currentCode(): string {
        return this._currentLanguage;
    }

    public get current(): LanguageOption | undefined {
        return this.supportedLanguages.find(l => l.code === this.currentCode);
    }

    public get localeId(): string {
        return LanguageService.localeIdByCode[this.currentCode] || this.currentCode;
    }

    public formatNumber(value: number, digitsInfo?: string): string {
        return formatNumber(value, this.localeId, digitsInfo);
    }

    public async ready(): Promise<void> {
        const loaded$ = this.translate.use(this.currentCode);
        await firstValueFrom(loaded$);
        this.applyDomAndManifest(this.currentCode);
    }

    public setLanguage(code: string): void {
        if (!this.supportedLanguages.some(l => l.code === code)) {
            return;
        }

        this._currentLanguage = code;
        this.translate.use(code);
        this.applyDomAndManifest(code);
    }

    private applyDomAndManifest(code: string): void {
        document.documentElement.lang = LanguageService.localeIdByCode[code] || code;

        const manifestLink = document.getElementById(LanguageService.manifestLinkId) as HTMLLinkElement | null;
        if (manifestLink) {
            manifestLink.href = code === LanguageService.defaultCode
                ? 'manifest.webmanifest'
                : `manifest.${code}.webmanifest`;
        }
    }
}
