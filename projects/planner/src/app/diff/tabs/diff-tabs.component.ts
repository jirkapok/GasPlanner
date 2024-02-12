import { Component } from '@angular/core';
import {DiveSchedules} from '../../shared/dive.schedules';

@Component({
    selector: 'app-diff-tabs',
    templateUrl: './diff-tabs.component.html',
    styleUrls: ['./diff-tabs.component.scss']
})
export class DiffTabsComponent {
    constructor(public schedules: DiveSchedules) {
    }

}
