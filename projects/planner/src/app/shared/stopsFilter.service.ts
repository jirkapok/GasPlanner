import { Injectable } from '@angular/core';
import {
    BreathingModelFactory, CircuitType, ClosedCircuitBreathing, DepthConverterFactory
} from 'scuba-physics';
import { DiveResults } from './diveresults';
import { DiveSchedules } from './dive.schedules';
import { WayPoint, SwimAction } from './wayPoint';
import { ViewSwitchService } from './viewSwitchService';

@Injectable()
export class StopsFilter {
    public _stopsOnly = false;

    constructor(private schedules: DiveSchedules, private viewSwitch: ViewSwitchService) { }

    public get stopsOnly(): boolean {
        return this._stopsOnly;
    }

    /** Only rebreather dives have the bailout profile */
    public get isRebreather(): boolean {
        return this.schedules.selected.circuit !== CircuitType.oc;
    }

    public get showBailout(): boolean {
        return this.isRebreather && this.viewSwitch.showBailoutProfile;
    }

    public get totalDuration(): number {
        if (this.showBailout) {
            const bailout = this.bailoutWayPoints;
            return bailout.length > 0 ? bailout[bailout.length - 1].endTime : 0;
        }

        return this.dive.totalDuration;
    }

    public get profileCalculated(): boolean {
        return this.dive.profileCalculated;
    }

    /** Waypoints of the selected profile (dive or bailout) */
    public get wayPoints(): WayPoint[] {
        const allWayPoints = this.showBailout ? this.bailoutWayPoints : this.dive.wayPoints;

        if(!this.stopsOnly) {
            return allWayPoints;
        }

        const depths = this.schedules.selectedDepths;
        return allWayPoints.filter((item, index) =>
            index < depths.startAscentIndex ||     // all user defined waypoints
            index === allWayPoints.length - 1 ||   // ascent to surface
            (item.swimAction === SwimAction.hover || item.swimAction === SwimAction.switch)  // all stops
        );
    }

    private get breathing(): ClosedCircuitBreathing | undefined {
        const options = this.schedules.selectedOptions;
        const depthConverter = new DepthConverterFactory(options.getOptions()).create();
        const breathing = BreathingModelFactory.create(options.getOptions(), options.getDiver().rmv, [], depthConverter);
        return breathing instanceof ClosedCircuitBreathing ? breathing : undefined;
    }

    /** Dive profile till the ascent start continued by the emergency ascent breathed from bailout tanks */
    private get bailoutWayPoints(): WayPoint[] {
        const ascentStart = this.dive.emergencyAscentStart;
        const planned = this.dive.wayPoints.filter(w => w.endTime <= ascentStart);
        return planned.concat(this.dive.emergencyAscent);
    }

    private get dive(): DiveResults {
        return this.schedules.selectedResult;
    }

    public switchFilter(): void {
        this._stopsOnly = !this._stopsOnly;
    }

    /**
     * Setpoint held by closed circuit rebreathers at end of the waypoint.
     * Undefined for other circuits and for the bailout ascent breathed as open circuit.
     */
    public setpoint(point: WayPoint): number | undefined {
        const breathing = this.breathing;
        if (!breathing) {
            return undefined;
        }

        if (this.showBailout && point.startTime >= this.dive.emergencyAscentStart) {
            return undefined;
        }

        const isAscent = point.startTime >= this.schedules.selectedDepths.startAscentTime;
        return breathing.setpoint(point.endDepthMeters, isAscent);
    }
}
