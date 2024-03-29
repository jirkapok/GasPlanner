import {Component} from '@angular/core';
import {faTasks} from '@fortawesome/free-solid-svg-icons';
import {UnitConversion} from '../../shared/UnitConversion';
import {WaypointsDifferenceService} from '../../shared/waypoints-difference.service';
import {ProfileComparatorService} from '../../shared/profileComparatorService';

@Component({
    selector: 'app-diff-waypoints',
    templateUrl: './diff-waypoints.component.html',
    styleUrls: ['./diff-waypoints.component.scss'],
})
export class WaypointsDifferenceComponent {
    public tasks = faTasks;

    constructor(public units: UnitConversion,
        public tableRowProvider: WaypointsDifferenceService,
        public profileComparatorService: ProfileComparatorService) {
    }
}
