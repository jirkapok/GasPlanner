import { Provider } from '@angular/core';
import { provideTranslateService, provideTranslateLoader, TranslateNoOpLoader } from '@ngx-translate/core';

/**
 * Provides ngx-translate with a no-op loader for component/service specs.
 * The `translate` pipe/service then falls back to returning the key itself,
 * so specs can assert against stable translation keys instead of localized text.
 */
export function provideTestTranslate(): Provider[] {
    return provideTranslateService({
        loader: provideTranslateLoader(TranslateNoOpLoader),
        fallbackLang: 'en',
    });
}
