import {
    AppPreferencesDto, DiverDto, GasDto,
    OptionsDto, SegmentDto, TankDto, DiveDto
} from './serialization.model';
import _ from 'lodash';
import { SafetyStop, Salinity, Time } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';

export class PlanValidation {
    // TODO consider validate against target units
    // values stored in metric doesn't have to fit to imperial ranges when saving imperial
    /** the internal storage is always in metric units */
    private ranges = UnitConversion.createMetricRanges();
    /** Only for working pressure, which needs to be compared in imperial */
    private rangesImperial = UnitConversion.createImperial();
    private simpleDurationRange: [number, number];
    private complexDurationRange: [number, number];

    constructor() {
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
        const sizeValid = this.isInRange(tank.size, this.ranges.tankSize);
        const presureValid = this.isInRange(tank.startPressure, this.ranges.tankPressure);
        const workPressureValid = this.workingPressureValid(imperialUnits, tank);
        const gasValid = this.isValidGas(tank.gas, contentRanges);
        return idValid && sizeValid && presureValid && gasValid && workPressureValid;
    }

    private workingPressureValid(imperialUnits: boolean, tank: TankDto): boolean {
        if(imperialUnits) {
            const workingPressure = this.rangesImperial.units.fromBar(tank.workPressure);
            return this.isInRange(workingPressure, this.rangesImperial.tankPressure);
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
        const startValid = this.isInRange(segment.startDepth, [0, 350]);
        const endValid = this.isInRange(segment.endDepth, [0, 350]);
        const durationValid = this.isInRange(segment.duration, durationRange);
        const gasValid = this.isValidGas(segment.gas, contentRanges);
        return tankValid && startValid && endValid && durationValid && gasValid;
    }

    private optionsValid(options: OptionsDto): boolean {
        // we don't check boolean values, since they are imported correctly
        return this.isInRange(options.altitude, this.ranges.altitude) &&
        this.isInRange(options.ascentSpeed50perc, this.ranges.speed) &&
        this.isInRange(options.ascentSpeed50percTo6m, this.ranges.speed) &&
        this.isInRange(options.ascentSpeed6m, this.ranges.speed) &&
        this.isInRange(options.descentSpeed, this.ranges.speed) &&
        this.isInRange(options.gasSwitchDuration, [1, 10]) &&
        this.isInRange(options.gfHigh, [0.1, 1]) &&
        this.isInRange(options.gfLow, [0.1, 1]) &&
        this.isInRange(options.maxDecoPpO2, this.ranges.ppO2) &&
        this.isInRange(options.maxEND, this.ranges.narcoticDepth) &&
        this.isInRange(options.maxPpO2, this.ranges.ppO2) &&
        this.isInRange(options.problemSolvingDuration, [1, 100]) &&
        options.safetyStop in SafetyStop &&
        options.salinity in Salinity;
    }

    private diverValid(diver: DiverDto): boolean {
        return this.isInRange(diver.rmv, this.ranges.diverRmv) &&
            this.isInRange(diver.maxPpO2, this.ranges.ppO2) &&
            this.isInRange(diver.maxDecoPpO2, this.ranges.ppO2);
    }

    private complexModeValid(app: AppPreferencesDto): boolean {
        return app.options.isComplex || this.allDivesSimple(app.dives);
    }

    private allDivesSimple(dives: DiveDto[]): boolean {
        return _(dives).every(d => d.plan.length === 2 && d.tanks.length === 1);
    }

    private isInRange(value: number, range: [number, number]): boolean {
        return range[0] <= value && value <= range[1];
    }
}
