import { Component, OnInit } from '@angular/core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { Streamed } from '../shared/streamed';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { UnitConversion } from '../shared/UnitConversion';
import { DashboardStartUp } from '../shared/startUp';
import { PlannerService } from '../shared/planner.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends Streamed implements OnInit {
    public exclamation = faExclamationTriangle;

    constructor(
        private viewSwitch: ViewSwitchService,
        private planner: PlannerService,
        private units: UnitConversion,
        public startup: DashboardStartUp) {
        super();
    }

    public get isComplex(): boolean {
        return this.viewSwitch.isComplex;
    }

    public get imperialUnits(): boolean {
        return this.units.imperialUnits;
    }

    public ngOnInit(): void {
        this.startup.onDashboard();

        // because the calculation runs in background first it subscribes,
        // than it starts to receive the event. Even for the initial calls.
        this.planner.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.startup.updateQueryParams());
    }
}
