import { AppPreferences, DiverDto, GasDto, OptionsDto, SegmentDto, TankDto } from './serialization.model';
import _ from 'lodash';
import { SafetyStop, Salinity } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';

export class PlanValidation {
    // the internal storage is always in metric units
    private ranges = UnitConversion.createMetricRanges();

    public validate(plan: AppPreferences): boolean {
        // TODO tank ids are ordered
        const maxTankId = plan.tanks.length + 1;
        const contentRanges = this.selectContentRanges(plan.isComplex);
        const tanksValid = this.allTanksValid(plan.tanks, maxTankId, contentRanges);
        const segmentsValid = this.allSegmentsValid(plan.plan, maxTankId, contentRanges);
        const optionsValid = this.optionsValid(plan.options);
        const diverValid = this.diverValid(plan.diver);
        const complexValid = this.complexModeValid(plan);
        return tanksValid && segmentsValid && optionsValid && diverValid && complexValid;
    }

    private selectContentRanges(isComplex: boolean): [[number, number], [number, number]] {
        if(isComplex) {
            return [this.ranges.trimixOxygen, this.ranges.tankHe];
        }

        return [this.ranges.nitroxOxygen, [0,0]];
    }

    private allTanksValid(tanks: TankDto[], maxTankId: number, contentRanges: [[number, number], [number, number]]): boolean {
        const hasTanks = tanks.length > 1;
        const allValid = _(tanks).every(t => this.isValidTank(t, maxTankId, contentRanges));
        const uniqueIds = _(tanks).map(t=> t.id).uniq();
        const countValid = uniqueIds.size() === tanks.length;
        return hasTanks && allValid && countValid;
    }

    private isValidTank(tank: TankDto, maxId: number, contentRanges: [[number, number], [number, number]]): boolean {
        // the rest will be recalculated
        const idValid = this.isInRange(tank.id, [1, maxId]);
        const sizeValid = this.isInRange(tank.size, this.ranges.tankSize);
        const presureValid = this.isInRange(tank.startPressure, this.ranges.tankPressure);
        const gasValid = this.isValidGas(tank.gas, contentRanges);
        return idValid && sizeValid && presureValid && gasValid;
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

    private allSegmentsValid(segments: SegmentDto[], maxTankId: number, contentRanges: [[number, number], [number, number]]): boolean {
        // TODO each segment follows the previous one by start depth?
        return segments.length > 0 &&
             _(segments).every(s => this.isValidSegment(s, maxTankId, contentRanges));
    }

    private isValidSegment(segment: SegmentDto, maxTankId: number, contentRanges: [[number, number], [number, number]]): boolean {
        // it is a plan, so all segments need to have tankId
        return this.isInRange(segment.tankId, [1, maxTankId]) &&
            // cant use range, since the values may end at surface
            this.isInRange(segment.startDepth, [0, 350]) &&
            this.isInRange(segment.endDepth, [0, 350]) &&
            this.isInRange(segment.duration, this.ranges.duration) &&
            this.isValidGas(segment.gas, contentRanges);
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

    private complexModeValid(plan: AppPreferences): boolean {
        return plan.isComplex ||
            (plan.plan.length === 2 && plan.tanks.length === 1);
    }

    private isInRange(value: number, range: [number, number]): boolean {
        return range[0] <= value && value <= range[1];
    }
}
