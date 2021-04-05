import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { PlannerService } from './shared/planner.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(updates: SwUpdate, planner: PlannerService) {
        planner.calculate();

        updates.available.subscribe(event => {
            updates.activateUpdate().then(() => {
                document.location.reload();
            });
        });
    }
}
