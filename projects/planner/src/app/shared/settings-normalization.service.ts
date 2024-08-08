import { Injectable } from '@angular/core';
import { Precision } from 'scuba-physics';
import { OptionsService } from './options.service';
import { TanksService } from './tanks.service';
import { RangeConstants, UnitConversion } from './UnitConversion';
import { ViewStates } from './viewStates';
import { DepthsService } from './depths.service';
import { DiveSchedule, DiveSchedules } from './dive.schedules';

@Injectable()
export class SettingsNormalizationService {
    constructor(
        private units: UnitConversion,
        private schedules: DiveSchedules
    ) { }

    private get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public apply(): void {
        this.schedules.dives.forEach(d => this.applyDive(d));
    }

    public applyDive(dive: DiveSchedule): void {
        this.applyToOptions(dive.optionsService);
        this.normalizeTanks(dive.tanksService);
        this.normalizeSegments(dive.depths);
    }

    private applyToOptions(options: OptionsService): void {
        const oDiver = options.diverOptions;
        const rmvRounding = this.units.ranges.rmvRounding;
        options.diverOptions.rmv = this.fitUnit(v => this.units.fromLiter(v), v => this.units.toLiter(v),
            oDiver.rmv, this.units.ranges.diverRmv, rmvRounding);
        options.diverOptions.stressRmv = this.fitUnit(v => this.units.fromLiter(v), v => this.units.toLiter(v),
            oDiver.stressRmv, this.units.ranges.diverRmv, rmvRounding);
        this.applyOptionsCalculationValues(options);
        this.normalizeOptions(options);
    }

    private applyOptionsCalculationValues(options: OptionsService): void {
        const defaults = this.units.defaults;
        // options need to be in metrics only
        const targetOptions = options.getOptions();
        targetOptions.decoStopDistance = this.units.toMeters(defaults.stopsDistance);
        targetOptions.minimumAutoStopDepth = this.units.toMeters(defaults.autoStopLevel);
        // unable to fit the stop, the lowest value is always the minimum distance
        targetOptions.lastStopDepth = this.units.toMeters(defaults.stopsDistance);
    }

    private normalizeOptions(options: OptionsService): void {
        const altitudeRange = this.ranges.altitude;
        const speedRange = this.ranges.speed;
        options.altitude = this.fitUnit(u => u, v => v, options.altitude, altitudeRange);
        options.ascentSpeed50perc = this.fitUnit(u => u, v => v, options.ascentSpeed50perc, speedRange);
        options.ascentSpeed50percTo6m = this.fitUnit(u => u, v => v, options.ascentSpeed50percTo6m, speedRange);
        options.ascentSpeed6m = this.fitUnit(u => u, v => v, options.ascentSpeed6m, speedRange);
        options.descentSpeed = this.fitUnit(u => u, v => v, options.descentSpeed, speedRange);
        options.lastStopDepth = this.fitUnit(u => u, v => v, options.lastStopDepth, this.ranges.lastStopDepth);
        options.maxEND = this.fitUnit(u => u, v => v, options.maxEND, this.ranges.narcoticDepth);
    }

    private normalizeTanks(tanksService: TanksService): void {
        const tanks = tanksService.tanks;
        const defaultTanks = this.units.defaults.tanks;

        tanks.forEach(t => {
            const tank = t.tank;
            // otherwise loosing precision in metric, where the value is even not relevant
            if(this.units.imperialUnits) {
                const size = tank.size;

                // reset only in case switching to imperial
                if(t.workingPressure === 0) {
                    t.workingPressure = defaultTanks.primary.workingPressure;
                }

                // may cause rounding of size, but this happens in when loading metric dive to imperial units
                t.workingPressureBars = this.fitPressureToRange(t.workingPressureBars, this.ranges.tankPressure);
                // to keep it aligned with previous value in bars
                t.size = this.units.fromTankLiters(size, t.workingPressureBars);
            } else {
                t.workingPressureBars = 0;
            }

            // the rest (consumed and reserve) will be calculated
            tank.startPressure = this.fitPressureToRange(tank.startPressure, this.ranges.tankPressure);
            tank.size = this.fitTankSizeToRange(tank.size, t.workingPressureBars, this.ranges.tankSize);
        });
    }

    private normalizeSegments(depthsService: DepthsService): void {
        const segments = depthsService.segments;
        // rounding to imperial units rounds 30 m to 98 ft.
        segments.forEach(s => {
            s.startDepth = this.fitLengthToRange(s.startDepth, this.ranges.depth);
            s.endDepth = this.fitLengthToRange(s.endDepth, this.ranges.depth);
        });

        // fixes start depth back to surface after moved to UI range.
        depthsService.fixDepths();
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
            size, range, 1);
    }

    /** Ranges are in UI units, we are rounding for the UI */
    private fitUnit(fromMetric: (v: number) => number, toMetric: (v: number) => number,
        unitValue: number, range: [number, number], precision: number = 0): number {
        let newValue = fromMetric(unitValue);
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
