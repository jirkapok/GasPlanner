import { enableProdMode, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeCs from '@angular/common/locales/cs';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localeRu from '@angular/common/locales/ru';
import localeZhHans from '@angular/common/locales/zh-Hans';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { CONFIG } from './app/app.config';

if (environment.production) {
    enableProdMode();
}

// en (en-US) locale data is bundled by default; the rest of the supported
// languages need to be registered explicitly for locale-aware number formatting.
registerLocaleData(localeDe);
registerLocaleData(localeCs);
registerLocaleData(localeEs);
registerLocaleData(localeFr);
registerLocaleData(localeRu);
registerLocaleData(localeZhHans);

bootstrapApplication(AppComponent, {...CONFIG, providers: [provideZoneChangeDetection(), ...CONFIG.providers]})
    .catch((err) => console.error(err));
