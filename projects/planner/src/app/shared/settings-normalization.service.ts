import { Injectable } from '@angular/core';
import { Diver, ImperialUnits, Precision } from 'scuba-physics';
import { OptionsDispatcherService } from './options-dispatcher.service';
import { PlannerService } from './planner.service';
import { TanksService } from './tanks.service';
import { RangeConstants, UnitConversion } from './UnitConversion';

@Injectable()
export class SettingsNormalizationService {

    constructor(private planner: PlannerService,
        private options: OptionsDispatcherService,
        private units: UnitConversion,
        private tanksService: TanksService) { }

    private get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public apply(diver: Diver, imperialUnits: boolean): void {
        this.units.imperialUnits = imperialUnits;
        this.planner.applyDiver(diver);
        this.applyToOptions(diver);
        this.normalizeTanks();
        this.normalizeSegments();
    }

    private applyToOptions(diver: Diver): void {
        this.options.applyDiver(diver);
        this.applyOptionsCalculationValues();
        this.normalizeOptions(this.ranges);
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

    private normalizeTanks(): void {
        const tanks = this.tanksService.tanks;
        tanks.forEach(t => {
            t.startPressure = this.fitPressureToRange(t.startPressure, this.ranges.tankPressure);
            t.size = this.fitTankSizeToRange(t.size, this.ranges.tankSize);
            // the rest (consumed and reserve) will be calculated
        });
    }

    private normalizeSegments(): void {
        const segments = this.planner.plan.segments;
        segments.forEach(s => {
            s.startDepth = this.fitLengthToRange(s.startDepth, this.ranges.depth);
            s.endDepth = this.fitLengthToRange(s.endDepth, this.ranges.depth);
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
        // TODO working pressure
        const workingPressure = ImperialUnits.defaultWorkingPressure;
        return this.fitUnit(v => this.units.fromTankLiters(v, workingPressure),
            v => this.units.toTankLiters(v, workingPressure),
            size, range);
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
