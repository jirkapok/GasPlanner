import { Component } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, WayPoint, SwimAction } from '../shared/models';
import { faArrowDown, faArrowUp, faArrowRight, faTasks, faRandom, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { UnitConversion } from '../shared/UnitConversion';
import { SelectedWaypoint } from '../shared/selectedwaypointService';

@Component({
    selector: 'app-waypoints',
    templateUrl: './waypoints.component.html',
    styleUrls: ['./waypoints.component.scss']
})
export class WayPointsComponent {
    public dive: Dive;
    public down = faArrowDown;
    public up = faArrowUp;
    public hover = faArrowRight;
    public tasks = faTasks;
    public switch = faRandom;

    constructor(private planner: PlannerService, public units: UnitConversion, private selectedWaypoint: SelectedWaypoint) {
        this.dive = this.planner.dive;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    public get totalDuration(): number {
        return this.dive.totalDuration;
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

    public toEndDepth(point: WayPoint): number {
        return this.units.fromMeters(point.endDepth);
    }

    public iconClasses(point: WayPoint): any {
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
