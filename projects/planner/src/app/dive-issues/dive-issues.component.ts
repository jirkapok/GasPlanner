import { Component } from '@angular/core';
import { DiveResults } from '../shared/diveresults';
import { PlannerService } from '../shared/planner.service';
import {
    faExclamationCircle, faExclamationTriangle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { Event, EventType, OtuCalculator } from 'scuba-physics';
import { UnitConversion } from '../shared/UnitConversion';
import { Plan } from '../shared/plan.service';
import _ from 'lodash';

@Component({
    selector: 'app-dive-issues',
    templateUrl: './dive-issues.component.html',
    styleUrls: ['./dive-issues.component.scss']
})
export class DiveIssuesComponent {
    public dive: DiveResults;
    public exclamation = faExclamationCircle;
    public warning = faExclamationTriangle;
    public info = faInfoCircle;
    public otuLimit = OtuCalculator.dailyLimit;

    constructor(private planner: PlannerService,
        public units: UnitConversion,
        private plan: Plan) {
        this.dive = this.planner.dive;
    }

    public get events(): Event[] {
        return _(this.dive.events).sortBy(e => e.timeStamp)
            .value();
    }

    public get minimumDuration(): number {
        return this.plan.duration + 1;
    }

    public get noDeco(): number {
        return this.planner.dive.noDecoTime;
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
