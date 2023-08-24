import { Component } from '@angular/core';
import { PreferencesService } from './shared/preferences.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    constructor(preferences: PreferencesService) {
        preferences.loadDefaults();
    }
}
