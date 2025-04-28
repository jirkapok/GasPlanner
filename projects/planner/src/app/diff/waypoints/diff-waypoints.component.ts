import { Component } from '@angular/core';
import { faTasks } from '@fortawesome/free-solid-svg-icons';
import { UnitConversion } from '../../shared/UnitConversion';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { ComparedWaypoint } from '../../shared/diff/ComparedWaypoint';

@Component({
    selector: 'app-diff-waypoints',
    templateUrl: './diff-waypoints.component.html',
    styleUrls: ['./diff-waypoints.component.scss', '../diff.component.scss'],
    standalone: false
})
export class WaypointsDifferenceComponent {
    public tasks = faTasks;

    constructor(public units: UnitConversion,
        public profileDiff: ProfileComparatorService,
        private selectedDiff: SelectedDiffWaypoint) {
    }

    public highlightRow(point: ComparedWaypoint | undefined): void {
        this.selectedDiff.selected = point;
    }
}
