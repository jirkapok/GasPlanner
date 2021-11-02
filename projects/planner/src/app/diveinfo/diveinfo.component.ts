import { Component } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive } from '../shared/models';
import { DateFormats } from '../shared/formaters';
import { faExclamationCircle, faExclamationTriangle, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import { EventType, Event, Time, Tank } from 'scuba-physics';

@Component({
    selector: 'app-consumption',
    templateUrl: './diveinfo.component.html',
    styleUrls: ['./diveinfo.component.css']
})
export class DiveInfoComponent {
    public dive: Dive;
    public exclamation = faExclamationCircle;
    public warning = faExclamationTriangle;
    public icon = faSlidersH;

    constructor(private planer: PlannerService) {
        this.dive = this.planer.dive;
    }

    public get tanks(): Tank[] {
        return this.planer.tanks;
    }

    public get showMaxBottomTime(): boolean {
        return this.dive.maxTime > 0;
    }

    public get needsReturn(): boolean {
        return this.planer.plan.needsReturn;
    }

    public get noDeco(): number {
        return this.planer.plan.noDecoTime;
    }

    public get minimumDuration(): number {
        return this.planer.plan.duration + 1;
    }

    public timeStampToString(seconds: number): Date{
        return Time.toDate(seconds);
    }

    public durationFormat(seconds: number): string {
        return DateFormats.selectTimeFormat(seconds);
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
}
