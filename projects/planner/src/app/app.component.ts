import { Component } from '@angular/core';
import { PlannerService } from './shared/planner.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(planner: PlannerService) {
        planner.calculate();
    }
}
