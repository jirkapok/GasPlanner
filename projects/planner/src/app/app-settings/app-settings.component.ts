import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { faFlag } from '@fortawesome/free-regular-svg-icons';
import { Diver, Precision } from 'scuba-physics';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-app-settings',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.css']
})
export class AppSettingsComponent {
    public flagIcon = faFlag;
    public diver = new Diver();
    public imperialUnits = false;

    constructor(private router: Router, public units: UnitConversion,
        private options: OptionsDispatcherService,
        private planner: PlannerService) {
        this.imperialUnits = this.units.imperialUnits;
        this.diver.loadFrom(this.planner.diver);
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        // TODO save settings only if form is valid
        this.planner.applyDiver(this.diver);
        this.units.imperialUnits = this.imperialUnits;
        const ranges = this.units.ranges;
        this.applyToOptions(ranges);
        this.normalizeTanks(ranges);
        this.normalizeSegments(ranges);
    }

    private applyToOptions(ranges: RangeConstants): void {
        this.options.applyDiver(this.diver);
        this.applyOptionsCalculationValues();
        this.normalizeOptions(ranges);
        this.planner.assignOptions(this.options);
    }

    private applyOptionsCalculationValues(): void {
        // options need to be in metrics only
        this.options.decoStopDistance = this.units.toMeters(this.units.stopsDistance);
        // unable to fit the stop, the lowest value is always the minimum distance
        this.options.lastStopDepth = this.units.toMeters(this.units.stopsDistance);
        this.options.minimumAutoStopDepth = this.units.toMeters(this.units.autoStopLevel);
    }

    private normalizeOptions(ranges: RangeConstants): void {
        this.options.maxEND = this.fitLengthToRange(this.options.maxEND, ranges.narcoticDepth);
        this.options.altitude = this.fitLengthToRange(this.options.altitude, ranges.altitude);
        this.options.ascentSpeed50perc = this.fitLengthToRange(this.options.ascentSpeed50perc, ranges.speed);
        this.options.ascentSpeed50percTo6m = this.fitLengthToRange(this.options.ascentSpeed50percTo6m, ranges.speed);
        this.options.ascentSpeed6m = this.fitLengthToRange(this.options.ascentSpeed6m, ranges.speed);
        this.options.descentSpeed = this.fitLengthToRange(this.options.descentSpeed, ranges.speed);
    }

    private normalizeTanks(ranges: RangeConstants): void {
        const tanks = this.planner.tanks;
        tanks.forEach(t => {
            t.startPressure = this.fitPressureToRange(t.startPressure, ranges.tankPressure);
            t.size = this.fitTankSizeToRange(t.size, ranges.tankSize);
            // the rest (consumed and reserve) will be calculated
        });
    }

    private normalizeSegments(ranges: RangeConstants): void {
        const segments = this.planner.plan.segments;
        segments.forEach(s => {
            s.startDepth = this.fitLengthToRange(s.startDepth, ranges.depth);
            s.endDepth = this.fitLengthToRange(s.endDepth, ranges.depth);
        });

        // fixes start depth back to surface after moved to UI range.
        this.planner.plan.fixDepths();
    }

    private fitLengthToRange(meters: number, range: [number, number]): number {
        return this.fitUnit(v => this.units.fromMeters(v), v => this.units.toMeters(v), meters, range);
    }

    private fitPressureToRange(bars: number, range: [number, number]): number {
        return this.fitUnit(v => this.units.fromBar(v), v => this.units.toBar(v), bars, range);
    }

    private fitTankSizeToRange(size: number, range: [number, number]): number {
        return this.fitUnit(v => this.units.fromTankLiters(v), v => this.units.toTankLiters(v), size, range);
    }

    /** Ranges are in UI units, we are rounding for the UI */
    private fitUnit(fromMetric: (v: number) => number, toMetric: (v: number) => number,
        bars: number, range: [number, number]): number {
        let newValue = fromMetric(bars);
        newValue = Precision.round(newValue, 0);
        newValue = this.fitToRange(newValue, range[0], range[1]);
        return toMetric(newValue);
    }

    private fitToRange(current: number, minimum: number, maximum: number): number {
        if (current > maximum) {
            return maximum;
        }

        if (current < minimum) {
            return minimum;
        }

        return current;
    }
}
