import { Component } from '@angular/core';
import { DiveResults } from '../shared/diveresults';
import {
    faExclamationCircle, faExclamationTriangle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { Event, EventType, OtuCalculator } from 'scuba-physics';
import { UnitConversion } from '../shared/UnitConversion';
import _ from 'lodash';
import {DiveSchedules} from '../shared/dive.schedules';

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

    public get events(): Event[] {
        return _(this.dive.events).sortBy(e => e.timeStamp)
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

    public isLowPpO2(event: Event): boolean {
        return event.type === EventType.lowPpO2;
    }

    public isHighPpO2(event: Event): boolean {
        return event.type === EventType.highPpO2;
    }

    public isHighAscentSpeed(event: Event): boolean {
        return event.type === EventType.highAscentSpeed;
    }

    public isHighDescentSpeed(event: Event): boolean {
        return event.type === EventType.highDescentSpeed;
    }

    public isBrokenCeiling(event: Event): boolean {
        return event.type === EventType.brokenCeiling;
    }

    public isHighN2Switch(event: Event): boolean {
        return event.type === EventType.switchToHigherN2;
    }

    public isMndExceeded(event: Event): boolean {
        return event.type === EventType.maxEndExceeded;
    }

    public isHighDensity(event: Event): boolean {
        return event.type === EventType.highGasDensity;
    }

    public eventDepthFor(event: Event): number {
        return this.units.fromMeters(event.depth);
    }
}
