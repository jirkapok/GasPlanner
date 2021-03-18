import { Component, Input } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, WayPoint, SwimAction } from '../shared/models';
import { faArrowDown, faArrowUp, faArrowRight, faTasks, faRandom, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Time } from 'scuba-physics';

@Component({
    selector: 'app-waypoints',
    templateUrl: './waypoints.component.html',
    styleUrls: ['./waypoints.component.css']
})
export class WayPointsComponent {
    public dive: Dive;
    public down = faArrowDown;
    public up = faArrowUp;
    public hover = faArrowRight;
    public tasks = faTasks;
    public switch = faRandom;
    private lastSelected: WayPoint | undefined;

    constructor(private planner: PlannerService) {
        this.dive = this.planner.dive;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    @Input()
    public set selectedTimeStamp(newValue: string) {
        if (this.lastSelected) {
            this.lastSelected.selected = false;
        }

        if (newValue) {
            const newTimeStamp = Time.secondsFromDate(newValue);
            this.lastSelected = this.dive.wayPoints.find(p => p.fits(newTimeStamp));
            if (this.lastSelected) {
                this.lastSelected.selected = true;
            }
        }
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

    public durationToString(seconds: number): Date {
        return Time.toDate(seconds);
    }

    public iconClasses(point: WayPoint): any {
        const classes = {
            'swim-down': point.swimAction === SwimAction.descent,
            'swim-up': point.swimAction === SwimAction.ascent,
            'swim-hover': point.swimAction === SwimAction.hover || point.swimAction === SwimAction.switch
        };

        return classes;
    }

    public selectTimeFormat(): string {
        if (this.dive.hasHoursRuntime) {
            return 'H:m:ss';
        }

        return 'm:ss';
    }
}
