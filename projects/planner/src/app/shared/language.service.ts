import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PreferencesStore } from './preferencesStore';

export interface LanguageOption {
    code: string;
    nativeName: string;
    flag: string;
}

@Injectable()
export class LanguageService {
    public readonly languages: LanguageOption[] = [
        { code: 'en', nativeName: 'English', flag: '🇬🇧' },
        { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
        { code: 'cs', nativeName: 'Čeština', flag: '🇨🇿' },
        { code: 'es', nativeName: 'Español', flag: '🇪🇸' },
        { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
        { code: 'ru', nativeName: 'Русский', flag: '🇷🇺' },
        { code: 'zh', nativeName: '简体中文', flag: '🇨🇳' },
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
