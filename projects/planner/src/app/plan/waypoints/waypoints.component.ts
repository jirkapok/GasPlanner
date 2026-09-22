import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
    faArrowDown, faArrowUp, faArrowRight, faTasks,
    faRandom, IconDefinition, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { UnitConversion } from '../../shared/UnitConversion';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { StopsFilter } from '../../shared/stopsFilter.service';
import { WayPoint, SwimAction } from '../../shared/wayPoint';
import { CardHeaderComponent } from '../../card-header/card-header.component';
import { NgClass, DecimalPipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CalculatingComponent } from '../../controls/calculating/calculating.component';
import { DurationPipe } from '../../pipes/duration.pipe';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-waypoints',
    templateUrl: './waypoints.component.html',
    styleUrls: ['./waypoints.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CardHeaderComponent, NgClass, FaIconComponent, CalculatingComponent, DecimalPipe, DurationPipe, TranslatePipe]
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
                return 'waypoints.ascent';
            case SwimAction.descent:
                return 'waypoints.descent';
            case SwimAction.switch:
                return 'waypoints.switch';
            default:
                return 'waypoints.hover';
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
