import { Injectable } from '@angular/core';
import { Precision } from 'scuba-physics';
import { OptionsService } from './options.service';
import { Plan } from './plan.service';
import { TanksService } from './tanks.service';
import { RangeConstants, UnitConversion } from './UnitConversion';

@Injectable()
export class SettingsNormalizationService {
    constructor(
        private options: OptionsService,
        private units: UnitConversion,
        private tanksService: TanksService,
        private plan: Plan) { }

    private get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public apply(): void {
        this.applyToOptions();
        this.normalizeTanks();
        this.normalizeSegments();
    }

    private applyToOptions(): void {
        const oDiver = this.options.diver;
        const rmvRounding = this.units.ranges.rmvRounding;
        this.options.diver.rmv = this.fitUnit(v => this.units.fromLiter(v), v => this.units.toLiter(v),
            oDiver.rmv, this.units.ranges.diverRmv, rmvRounding);

        this.applyOptionsCalculationValues();
        this.normalizeOptions();
    }

    private applyOptionsCalculationValues(): void {
        const defaults = this.units.defaults;
        // options need to be in metrics only
        this.options.decoStopDistance = this.units.toMeters(defaults.stopsDistance);
        // unable to fit the stop, the lowest value is always the minimum distance
        this.options.lastStopDepth = this.units.toMeters(defaults.stopsDistance);
        this.options.minimumAutoStopDepth = this.units.toMeters(defaults.autoStopLevel);
    }

    private normalizeOptions(): void {
        this.options.maxEND = this.fitLengthToRange(this.options.maxEND, this.ranges.narcoticDepth);
        this.options.altitude = this.fitLengthToRange(this.options.altitude, this.ranges.altitude);
        this.options.ascentSpeed50perc = this.fitLengthToRange(this.options.ascentSpeed50perc, this.ranges.speed);
        this.options.ascentSpeed50percTo6m = this.fitLengthToRange(this.options.ascentSpeed50percTo6m, this.ranges.speed);
        this.options.ascentSpeed6m = this.fitLengthToRange(this.options.ascentSpeed6m, this.ranges.speed);
        this.options.descentSpeed = this.fitLengthToRange(this.options.descentSpeed, this.ranges.speed);
    }

    private normalizeTanks(): void {
        const tanks = this.tanksService.tanks;
        tanks.forEach(t => {
            // otherwise loosing precision in metric, where the value is even not relevant
            if(this.units.imperialUnits) {
                // cheating to skip the conversion to bars, since we already have the value in imperial units
                t.workingPressure = this.fitUnit(v => v, v => v, t.workingPressure, this.ranges.tankPressure);
            } // TODO consider switching of working pressure to 0 im metric use case

            // the rest (consumed and reserve) will be calculated
            const tank = t.tank;
            tank.startPressure = this.fitPressureToRange(tank.startPressure, this.ranges.tankPressure);
            const workingPressureBars = this.units.toBar(t.workingPressure);
            tank.size = this.fitTankSizeToRange(tank.size, workingPressureBars, this.ranges.tankSize);
        });
    }

    private normalizeSegments(): void {
        const segments = this.plan.segments;
        segments.forEach(s => {
            s.startDepth = this.fitLengthToRange(s.startDepth, this.ranges.depth);
            s.endDepth = this.fitLengthToRange(s.endDepth, this.ranges.depth);
        });

        // fixes start depth back to surface after moved to UI range.
        this.plan.fixDepths();
    }

    private fitLengthToRange(meters: number, range: [number, number]): number {
        return this.fitUnit(v => this.units.fromMeters(v), v => this.units.toMeters(v), meters, range);
    }

    private fitPressureToRange(bars: number, range: [number, number]): number {
        return this.fitUnit(v => this.units.fromBar(v), v => this.units.toBar(v), bars, range);
    }

    private fitTankSizeToRange(size: number, workingPressureBars: number, range: [number, number]): number {
        return this.fitUnit(v => this.units.fromTankLiters(v, workingPressureBars),
            v => this.units.toTankLiters(v, workingPressureBars),
            size, range, 0); // TODO fix precision to 1
    }

    /** Ranges are in UI units, we are rounding for the UI */
    private fitUnit(fromMetric: (v: number) => number, toMetric: (v: number) => number,
        bars: number, range: [number, number], precision: number = 0): number {
        let newValue = fromMetric(bars);
        newValue = Precision.round(newValue, precision);
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
