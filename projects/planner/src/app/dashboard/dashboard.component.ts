import { Component, OnInit } from '@angular/core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import { Streamed } from '../shared/streamed';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { UnitConversion } from '../shared/UnitConversion';
import { DashboardStartUp } from '../shared/startUp';
import { ReloadDispatcher } from '../shared/reloadDispatcher';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends Streamed implements OnInit {
    public exclamation = faExclamationTriangle;

    constructor(
        private viewSwitch: ViewSwitchService,
        private units: UnitConversion,
        private dispatcher: ReloadDispatcher,
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
        // than it starts to receive the event.
        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.startup.updateQueryParams());
    }
}
