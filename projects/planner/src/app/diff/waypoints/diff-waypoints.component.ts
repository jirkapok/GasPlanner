import { Component } from '@angular/core';
import { faTasks } from '@fortawesome/free-solid-svg-icons';
import { UnitConversion } from '../../shared/UnitConversion';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';

@Component({
    selector: 'app-diff-waypoints',
    templateUrl: './diff-waypoints.component.html',
    styleUrls: ['./diff-waypoints.component.scss', '../diff.component.scss'],
})
export class WaypointsDifferenceComponent {
    public tasks = faTasks;

    constructor(public units: UnitConversion,
        public profileDiff: ProfileComparatorService) {
    }
}
