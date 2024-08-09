import { Component } from '@angular/core';
import {
    faArrowDown, faArrowUp, faArrowRight, faTasks,
    faRandom, IconDefinition, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { UnitConversion } from '../shared/UnitConversion';
import { SelectedWaypoint } from '../shared/selectedwaypointService';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { StopsFilter } from '../shared/stopsFilter.service';
import { WayPoint, SwimAction } from '../shared/wayPoint';

@Component({
    selector: 'app-waypoints',
    templateUrl: './waypoints.component.html',
    styleUrls: ['./waypoints.component.scss']
})
export class WayPointsComponent {
    public down = faArrowDown;
    public up = faArrowUp;
    public hover = faArrowRight;
    public tasks = faTasks;
    public switch = faRandom;
    public filterIcon = faFilter;

    constructor(
        public units: UnitConversion,
        private selectedWaypoint: SelectedWaypoint,
        private viewSwitch: ViewSwitchService,
        public stops: StopsFilter) { }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
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
            'swim-down': point.swimAction === SwimAction.descent,
            'swim-up': point.swimAction === SwimAction.ascent,
            'swim-hover': point.swimAction === SwimAction.hover || point.swimAction === SwimAction.switch
        };

        return classes;
    }

    public highlightRow(point: WayPoint | undefined): void {
        this.selectedWaypoint.selected = point;
    }
}
