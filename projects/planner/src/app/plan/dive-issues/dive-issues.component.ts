import { Component } from '@angular/core';
import {
    faExclamationCircle, faExclamationTriangle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import _ from 'lodash';
import { Event, EventType, OtuCalculator } from 'scuba-physics';
import { UnitConversion } from '../../shared/UnitConversion';
import {DiveSchedules} from '../../shared/dive.schedules';
import { DiveResults } from '../../shared/diveresults';

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
    public get events(): Event[] {
        return _(this.dive.events)
            .sortBy(e => this.priorityDescending(e), e => e.timeStamp)
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

    // TODO move methods to custom UI Event object
    public showNoDeco(event: Event): boolean {
        return event.type === EventType.noDecoEnd;
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
        return event.type === EventType.isobaricCounterDiffusion;
    }

    public isMndExceeded(event: Event): boolean {
        return event.type === EventType.maxEndExceeded;
    }

    public isHighDensity(event: Event): boolean {
        return event.type === EventType.highGasDensity;
    }

    public isMinDepth(event: Event): boolean {
        return event.type === EventType.minDepth;
    }

    public isMaxDepth(event: Event): boolean {
        return event.type === EventType.maxDepth;
    }

    public isMissingAirbreak(event: Event): boolean {
        return event.type === EventType.missingAirBreak;
    }

    public eventDepthFor(event: Event): number {
        return this.units.fromMeters(event.depth);
    }

    private priorityDescending(event: Event): number {
        return 100 - this.priority(event);
    }

    // TODO merge with diveResult.HasErrorEvent
    private priority(event: Event): number {
        switch (event.type) {
            case EventType.error:
            case EventType.brokenCeiling:
            case EventType.lowPpO2:
                return 2;

            case EventType.highPpO2:
            case EventType.highAscentSpeed:
            case EventType.highDescentSpeed:
            case EventType.maxEndExceeded:
            case EventType.isobaricCounterDiffusion:
            case EventType.highGasDensity:
            case EventType.minDepth:
            case EventType.maxDepth:
            case EventType.missingAirBreak:
                return 1;
            default:
                return 0;
        }
    }
}
