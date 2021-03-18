import { Component, OnInit } from '@angular/core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PreferencesService } from '../shared/preferences.service';
import { PlannerService } from '../shared/planner.service';
import { Dive } from '../shared/models';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    public showDisclaimer = true;
    public exclamation = faExclamationTriangle;
    private dive: Dive;
    public selectedTimeStamp = '';

    public get showResults(): boolean {
        return this.dive.calculated && !this.dive.hasErrors;
    }

    public get isComplex(): boolean {
        return this.planner.isComplex;
    }

    constructor(private preferences: PreferencesService, private planner: PlannerService) {
        this.dive = planner.dive;
    }

    ngOnInit(): void {
        this.showDisclaimer = this.preferences.disclaimerEnabled();
    }

    public stopDisclaimer(): void {
        this.showDisclaimer = false;
        this.preferences.disableDisclaimer();
    }

    public chartHover(timeStampValue: string): void {
        this.selectedTimeStamp = timeStampValue;
    }
}
