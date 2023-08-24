import { Component } from '@angular/core';
import { PreferencesStore } from './shared/preferencesStore';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    constructor(preferences: PreferencesStore) {
        preferences.load();
    }
}
