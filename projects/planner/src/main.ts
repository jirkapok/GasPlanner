import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { CONFIG } from './app/app.module';

if (environment.production) {
    enableProdMode();
}

bootstrapApplication(AppComponent, CONFIG)
    .catch((err) => console.error(err));
