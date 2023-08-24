import { Component } from '@angular/core';
import { StartUp } from './shared/startUp';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    constructor(startup: StartUp) {
        startup.onStart();
    }
}
