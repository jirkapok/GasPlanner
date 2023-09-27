import {
    AppPreferencesDto, DiverDto, GasDto,
    OptionsDto, SegmentDto, TankDto, DiveDto
} from './serialization.model';
import _ from 'lodash';
import { Precision, SafetyStop, Salinity, Time, Units } from 'scuba-physics';
import { RangeConstants, UnitConversion } from './UnitConversion';

export class PlanValidation {
    private ranges: RangeConstants;
    private units: Units;
    private simpleDurationRange: [number, number];
    private complexDurationRange: [number, number];

    constructor(targetImperialUnits: boolean) {
        this.ranges = this.createUnits(targetImperialUnits);
        this.units = this.ranges.units;

        // duration ranges are both the same for both units.
        const minDuration  = Time.toSeconds(this.ranges.duration[0]);
        const maxDuration  = Time.toSeconds(this.ranges.duration[1]);
        // min only 1 second, since simple profiles may have auto calculated descent shorter than one minute
        this.simpleDurationRange = [1, maxDuration];
        this.complexDurationRange = [minDuration, maxDuration];
    }

    public validate(appDto: AppPreferencesDto): boolean {
        if(appDto.dives.length === 0) {
            return false;
        }

        const isComplex = appDto.options.isComplex;
        const imperialUnits = appDto.options.imperialUnits;
        const result = appDto.dives.every(p => this.isValidPlan(p, isComplex, imperialUnits));
        const complexValid = this.complexModeValid(appDto);
        return result && complexValid;
    }

    private createUnits(imperialUnits: boolean): RangeConstants {
        // values stored in metric doesn't have to fit to imperial ranges when saving imperial
        if(imperialUnits) {
            return UnitConversion.createImperial();
        }

        return UnitConversion.createMetricRanges();
    }

    private isValidPlan(plan: DiveDto, isComplex: boolean, imperialUnits: boolean): boolean {
        const maxTankId = plan.tanks.length;
        const contentRanges = this.selectContentRanges(isComplex);
        const tanksValid = this.allTanksValid(imperialUnits, plan.tanks, maxTankId, contentRanges);
        const durationRange = this.selectDurationRanges(isComplex);
        const segmentsValid = this.allSegmentsValid(plan.plan, maxTankId, durationRange, contentRanges);
        const optionsValid = this.optionsValid(plan.options);
        const diverValid = this.diverValid(plan.diver);
        return tanksValid && segmentsValid && optionsValid && diverValid;
    }

    private selectContentRanges(isComplex: boolean): [[number, number], [number, number]] {
        if(isComplex) {
            return [this.ranges.trimixOxygen, this.ranges.tankHe];
        }

        return [this.ranges.nitroxOxygen, [0,0]];
    }

    private selectDurationRanges(isComplex: boolean): [number, number] {
        if(isComplex) {
            return this.complexDurationRange;
        }

        return this.simpleDurationRange;
    }

    private allTanksValid(imperialUnits: boolean, tanks: TankDto[], maxTankId: number,
        contentRanges: [[number, number], [number, number]]): boolean {
        const hasTanks = tanks.length > 0;
        const allValid = _(tanks).every(t => this.isValidTank(imperialUnits, t, maxTankId, contentRanges));
        const uniqueIds = _(tanks).map(t=> t.id).uniq();
        const countValid = uniqueIds.size() === tanks.length;
        return hasTanks && allValid && countValid;
    }

    private isValidTank(imperialUnits: boolean, tank: TankDto, maxId: number,
        contentRanges: [[number, number], [number, number]]): boolean {
        // the rest will be recalculated
        const idValid = this.isInRange(tank.id, [1, maxId]);
        const sizeValid = this.isTankSizeValid(tank);
        const pressureValid = this.isPressureInRange(tank.startPressure, this.ranges.tankPressure);
        const workPressureValid = this.workingPressureValid(imperialUnits, tank);
        const gasValid = this.isValidGas(tank.gas, contentRanges);
        return idValid && sizeValid && pressureValid && gasValid && workPressureValid;
    }

    private workingPressureValid(imperialUnits: boolean, tank: TankDto): boolean {
        if(imperialUnits) {
            return this.isPressureInRange(tank.workPressure, this.ranges.tankPressure);
        }

        return tank.workPressure === 0;
    }

    private isValidGas(gas: GasDto, contentRanges: [[number, number], [number, number]]): boolean {
        // because air is out of range
        const isAir = gas.fO2 === 0.209 && gas.fHe === 0;
        // because range is in percent
        const o2Valid = this.isInRange(gas.fO2 * 100, contentRanges[0]);
        const heValid = this.isInRange(gas.fHe * 100, contentRanges[1]);
        const contentValid = ((gas.fO2 + gas.fHe) <= 1);
        return isAir || (o2Valid && heValid && contentValid);
    }

    private allSegmentsValid(segments: SegmentDto[], maxTankId: number,
        durationRange: [number, number], contentRanges: [[number, number], [number, number]]): boolean {
        return segments.length > 0 &&
            _(segments).every(s => this.isValidSegment(s, maxTankId, durationRange, contentRanges));
    }

    private isValidSegment(segment: SegmentDto, maxTankId: number,
        durationRange: [number, number], contentRanges: [[number, number], [number, number]]): boolean {
        // it is a plan, so all segments need to have tankId
        const tankValid = this.isInRange(segment.tankId, [1, maxTankId]);
        // cant use range, since the values may end at surface
        const depthRange: [number, number] = [0, this.ranges.depth[1]];
        const startValid = this.isLengthInRange(segment.startDepth, depthRange);
        const endValid = this.isLengthInRange(segment.endDepth, depthRange);
        const durationValid = this.isInRange(segment.duration, durationRange);
        const gasValid = this.isValidGas(segment.gas, contentRanges);
        return tankValid && startValid && endValid && durationValid && gasValid;
    }

    private optionsValid(options: OptionsDto): boolean {
        // we don't check boolean values, since they are imported correctly
        return this.isLengthInRange(options.altitude, this.ranges.altitude) &&
        this.isLengthInRange(options.ascentSpeed50perc, this.ranges.speed) &&
        this.isLengthInRange(options.ascentSpeed50percTo6m, this.ranges.speed) &&
        this.isLengthInRange(options.ascentSpeed6m, this.ranges.speed) &&
        this.isLengthInRange(options.descentSpeed, this.ranges.speed) &&
        this.isInRange(options.gasSwitchDuration, [1, 10]) &&
        this.isInRange(options.gfHigh, [0.1, 1]) &&
        this.isInRange(options.gfLow, [0.1, 1]) &&
        this.isLengthInRange(options.maxEND, this.ranges.narcoticDepth) &&
        this.isInRange(options.maxPpO2, this.ranges.ppO2) &&
        this.isInRange(options.maxDecoPpO2, this.ranges.ppO2) &&
        this.isInRange(options.problemSolvingDuration, [1, 100]) &&
        options.safetyStop in SafetyStop &&
        options.salinity in Salinity;
    }

    private diverValid(diver: DiverDto): boolean {
        return this.isRmvValid(diver.rmv);
    }

    private complexModeValid(app: AppPreferencesDto): boolean {
        return app.options.isComplex || this.allDivesSimple(app.dives);
    }

    private allDivesSimple(dives: DiveDto[]): boolean {
        return _(dives).every(d => d.plan.length === 2 && d.tanks.length === 1);
    }

    private isRmvValid(rmvLiters: number): boolean {
        const rmv = this.units.fromLiter(rmvLiters);
        return this.isInRange(rmv, this.ranges.diverRmv);
    }

    private isTankSizeValid(tank: TankDto): boolean {
        const size = this.units.fromTankLiters(tank.size, tank.workPressure);
        return this.isInRange(size, this.ranges.tankSize);
    }

    private isPressureInRange(meters: number, range: [number, number]): boolean {
        const value = this.units.fromBar(meters);
        return this.isInRange(value, range);
    }

    private isLengthInRange(meters: number, range: [number, number]): boolean {
        const value = this.units.fromMeters(meters);
        return this.isInRange(value, range);
    }

    private isInRange(value: number, range: [number, number], ): boolean {
        // to prevent calculation precision issues, rmv needs at least 4 decimals
        const rounded = Precision.round(value, 6);
        return range[0] <= rounded && rounded <= range[1];
    }
}
