import { Component, OnInit } from '@angular/core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { Streamed } from '../shared/streamed';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { UnitConversion } from '../shared/UnitConversion';
import { StartUp } from '../shared/startUp';

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
        public startup: StartUp) {
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
    }
}
