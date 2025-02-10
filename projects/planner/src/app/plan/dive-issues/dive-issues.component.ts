import { Component } from '@angular/core';
import {
    faExclamationCircle, faExclamationTriangle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import { OtuCalculator } from 'scuba-physics';
import { UnitConversion } from '../../shared/UnitConversion';
import { DiveSchedules } from '../../shared/dive.schedules';
import { DiveResults } from '../../shared/diveresults';
import { BoundEvent } from "../../shared/models";

@Component({
    selector: 'app-dive-issues',
    templateUrl: './dive-issues.component.html',
    styleUrls: ['./dive-issues.component.scss']
})
export class DiveIssuesComponent {
    public exclamation = faExclamationCircle;
    public warning = faExclamationTriangle;
    public info = faInfoCircle;
    public otuLimit = OtuCalculator.dailyLimit;

    constructor(
        public units: UnitConversion,
        private schedules: DiveSchedules) {
    }

    /** Needs to be sorted by order we want to show them */
    public get events(): BoundEvent[] {
        return _(this.dive.events)
            .sortBy(e => this.severityDescending(e), e => e.timeStamp)
            .value();
    }

    public get minimumDuration(): number {
        return this.schedules.selectedDepths.planDuration + 1;
    }

    public get noDeco(): number {
        return this.dive.noDecoTime;
    }

    public get dive(): DiveResults {
        return this.schedules.selectedResult;
    }

    private severityDescending(event: BoundEvent): number {
        return 100 - event.severity;
    }
}
