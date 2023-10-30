import {Component, Input} from '@angular/core';
import {TestData} from '../diff.component';
import {
    faArrowDown,
    faArrowRight,
    faArrowUp,
    faFilter,
    faRandom,
    faTasks,
    IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import {SwimAction, WayPoint} from '../../shared/models';
import {SelectedWaypoint} from '../../shared/selectedwaypointService';
import {UnitConversion} from "../../shared/UnitConversion";

@Component({
    selector: 'app-diff-waypoints',
    templateUrl: './diff-waypoints.component.html',
    styleUrls: ['./diff-waypoints.component.scss']
})
export class WaypointsDifferenceComponent {
    @Input() data: TestData | null = null;
    public down = faArrowDown;
    public up = faArrowUp;
    public hover = faArrowRight;
    public tasks = faTasks;
    public switch = faRandom;
    public filterIcon = faFilter;

    constructor(
        private selectedWaypoint: SelectedWaypoint,
        public units: UnitConversion
    ) {
    }

    public swimActionIcon(point: WayPoint): IconDefinition {
        switch (point.swimAction) {
            case SwimAction.ascent: return this.up;
            case SwimAction.descent: return this.down;
            case SwimAction.switch: return this.switch;
            default: return this.hover;
        }
    }

    public iconTitle(point: WayPoint): string {
        switch (point.swimAction) {
            case SwimAction.ascent:
                return 'ascent';
            case SwimAction.descent:
                return 'descent';
            case SwimAction.switch:
                return 'switch';
            default:
                return 'hover';
        }
    }

    public iconClasses(point: WayPoint): object {
        const classes = {
            'swimDown': point.swimAction === SwimAction.descent,
            'swimHover': point.swimAction === SwimAction.hover || point.swimAction === SwimAction.switch,
            'swimUp': point.swimAction === SwimAction.ascent
        };

        return classes;
    }

    public highlightRow(point: WayPoint | undefined): void {
        this.selectedWaypoint.selected = point;
    }

    public stops(): WayPoint[] | undefined {
        return this.data?.profileA.wayPoints;
    }
}
