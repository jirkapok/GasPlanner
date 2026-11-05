import {
    Ceiling, HighestDensity,
    TissueOverPressures, LoadedTissues,
    OtuCalculator, ProfileTissues, CnsExposure,
    CnsCalculator, CnsDailyCalculator, ConsumedGas, ConsumptionByGas,
    Event, Segment
} from 'scuba-physics';
import _ from 'lodash';
import { Injectable, signal } from '@angular/core';
import { WayPoint } from './wayPoint';
import { BoundEvent } from './models';

class CalculationState {
    private readonly _calculating = signal(false);
    private readonly _calculated = signal(false);

    public get calculated(): boolean {
        return this._calculated();
    }

    public get running(): boolean {
        return this._calculating();
    }

    public start(): void {
        this._calculating.set(true);
    }

    public stillRunning(): void {
        if (this._calculating()) {
            this._calculated.set(false);
        }
    }

    public finished(): void {
        this._calculated.set(true);
        this._calculating.set(false);
    }
}

interface ProfileState {
    wayPoints: WayPoint[];
    finalTissues: LoadedTissues;
    profile: Segment[];
}

interface DiveInfoState {
    noDecoTime: number;
    notEnoughTime: boolean;
    planDuration: number;
    averageDepth: number;
    surfaceGradient: number;
    offgasingStartTime: number;
    offgasingStartDepth: number;
    otu: number;
    cns: number;
    dailyCns: number;
    cnsExposures: CnsExposure[];
    highestDensity: HighestDensity;
    ceilings: Ceiling[];
    maxCeiling?: Ceiling;
    // 16 tissues overpressure history
    tissueOverPressures: TissueOverPressures[];
    events: BoundEvent[];
    algorithmEvents: Event[];
    // tissues history sampled every second at the same times as the ceilings, kept as received from the worker
    tissues: Float64Array;
}

interface ConsumptionState {
    maxTime: number;
    timeToSurface: number;
    emergencyAscentStart: number;
    emergencyAscent: WayPoint[];
    turnPressure: number;
    turnTime: number;
    needsReturn: boolean;
    notEnoughGas: boolean;
    consumedGases: ConsumedGas[];
}

const emptyProfile = (): ProfileState => ({
    wayPoints: [],
    finalTissues: ProfileTissues.createAtSurface(0),
    profile: []
});

const emptyDiveInfo = (): DiveInfoState => ({
    noDecoTime: 0,
    notEnoughTime: false,
    planDuration: 0,
    averageDepth: 0,
    surfaceGradient: 0,
    offgasingStartTime: 0,
    offgasingStartDepth: 0,
    otu: 0,
    cns: 0,
    dailyCns: 0,
    cnsExposures: [],
    highestDensity: HighestDensity.createDefault(),
    ceilings: [],
    tissueOverPressures: [],
    events: [],
    algorithmEvents: [],
    tissues: new Float64Array(0)
});

const emptyConsumption = (): ConsumptionState => ({
    maxTime: 0,
    timeToSurface: 0,
    emergencyAscentStart: 0,
    emergencyAscent: [],
    turnPressure: 0,
    turnTime: 0,
    needsReturn: false,
    notEnoughGas: false,
    consumedGases: []
});

/** Results of one dive. Kept in signals, because they are updated by web workers and timers outside Angular events. */
@Injectable()
export class DiveResults {
    private static readonly maxAcceptableNdl = 1000;

    private readonly _profileState = signal(emptyProfile());
    private readonly _diveInfoState = signal(emptyDiveInfo());
    private readonly _consumptionState = signal(emptyConsumption());

    private profileCalculation = new CalculationState();
    private consumptionCalculation = new CalculationState();
    private diveInfoCalculation = new CalculationState();
    private readonly _calculationFailed = signal(false);

    public get wayPoints(): WayPoint[] {
        return this._profileState().wayPoints;
    }

    /** Calculated profile in meters: user defined segments followed by the calculated ascent */
    public get profile(): Segment[] {
        return this._profileState().profile;
    }

    public get emergencyAscent(): WayPoint[] {
        return this._consumptionState().emergencyAscent;
    }

    /** In meaning of at end of the dive */
    public get finalTissues(): LoadedTissues {
        return this._profileState().finalTissues;
    }

    public get noDecoTime(): number {
        return this._diveInfoState().noDecoTime;
    }

    public get notEnoughTime(): boolean {
        return this._diveInfoState().notEnoughTime;
    }

    public get planDuration(): number {
        return this._diveInfoState().planDuration;
    }

    public get averageDepth(): number {
        return this._diveInfoState().averageDepth;
    }

    public get surfaceGradient(): number {
        return this._diveInfoState().surfaceGradient;
    }

    public get offgasingStartTime(): number {
        return this._diveInfoState().offgasingStartTime;
    }

    public get offgasingStartDepth(): number {
        return this._diveInfoState().offgasingStartDepth;
    }

    public get otu(): number {
        return this._diveInfoState().otu;
    }

    /** CNS % at end of the dive including residual CNS from previous dive */
    public get cns(): number {
        return this._diveInfoState().cns;
    }

    /** CNS % of the daily limit consumed by all dives within last 24 hours */
    public get dailyCns(): number {
        return this._diveInfoState().dailyCns;
    }

    /** Daily CNS exposures within last 24 hours at end of the dive */
    public get cnsExposures(): CnsExposure[] {
        return this._diveInfoState().cnsExposures;
    }

    public get highestDensity(): HighestDensity {
        return this._diveInfoState().highestDensity;
    }

    public get ceilings(): Ceiling[] {
        return this._diveInfoState().ceilings;
    }

    /**
     * Tissues history of the dive, sampled every second at the same times as the ceilings.
     * Packed and kept as received from the worker, see DtoSerialization.packTissuesHistory.
     */
    public get tissues(): Float64Array {
        return this._diveInfoState().tissues;
    }

    public get maxCeiling(): Ceiling | undefined {
        return this._diveInfoState().maxCeiling;
    }

    public get tissueOverPressures(): TissueOverPressures[] {
        return this._diveInfoState().tissueOverPressures;
    }

    public get events(): BoundEvent[] {
        return this._diveInfoState().events;
    }

    /** All events calculated by the algorithm, not filtered by the ignored issues. Used by the dive computer. */
    public get algorithmEvents(): Event[] {
        return this._diveInfoState().algorithmEvents;
    }

    public get maxTime(): number {
        return this._consumptionState().maxTime;
    }

    public get timeToSurface(): number {
        return this._consumptionState().timeToSurface;
    }

    public get emergencyAscentStart(): number {
        return this._consumptionState().emergencyAscentStart;
    }

    public get turnPressure(): number {
        return this._consumptionState().turnPressure;
    }

    public get turnTime(): number {
        return this._consumptionState().turnTime;
    }

    public get needsReturn(): boolean {
        return this._consumptionState().needsReturn;
    }

    public get notEnoughGas(): boolean {
        return this._consumptionState().notEnoughGas;
    }

    /** Consumption grouped by gas in liters, ignoring tanks */
    public get consumedGases(): ConsumedGas[] {
        return this._consumptionState().consumedGases;
    }

    /** Not enough gas evaluated from consumption grouped by gas */
    public get notEnoughGasByGas(): boolean {
        return !ConsumptionByGas.haveReserve(this.consumedGases);
    }

    /**
     * Only if both consumption and dive info finished already, since they are running in parallel.
     * Not checking if background calculation is still running, so this only shows last known state.
     * */
    public get calculated(): boolean {
        return this.consumptionCalculated && this.diveInfoCalculated;
    }

    public get profileCalculated(): boolean {
        return this.profileCalculation.calculated;
    }

    public get diveInfoCalculated(): boolean {
        return this.diveInfoCalculation.calculated;
    }

    public get consumptionCalculated(): boolean {
        return this.consumptionCalculation.calculated;
    }

    public get running(): boolean {
        return !this.calculated || this.consumptionCalculation.running || this.diveInfoCalculation.running;
    }

    public get failed(): boolean {
        return this._calculationFailed();
    }

    /** can't use plan duration, because it doesn't contain ascent */
    public get totalDuration(): number {
        const wayPoints = this.wayPoints;
        if (wayPoints.length === 0) {
            return 0;
        }

        return wayPoints[wayPoints.length - 1].endTime;
    }

    public get ndlValid(): boolean {
        return this.diveInfoCalculated && this.noDecoTime < DiveResults.maxAcceptableNdl;
    }

    /** the only errors preventing draw chart */
    public get hasErrors(): boolean {
        return this.calculated && (this.failed || this.notEnoughTime);
    }

    public get showResults(): boolean {
        return this.consumptionCalculated && !this.hasErrors;
    }

    public get otuExceeded(): boolean {
        return this.otu > (.8 * OtuCalculator.dailyLimit);
    }

    public get cnsExceeded(): boolean {
        return this.cns > (.8 * CnsCalculator.limit) ||
            this.dailyCns > (.8 * CnsDailyCalculator.dailyLimit);
    }

    /** The higher of the dive CNS and daily CNS in % */
    public get cnsWarningLevel(): number {
        return Math.max(this.cns, this.dailyCns);
    }

    public get showMaxDuration(): boolean {
        return this.consumptionCalculated && this.showMaxBottomTime;
    }

    public get showMaxBottomTime(): boolean {
        return this.maxTime > 0;
    }

    public get hasErrorEvent(): boolean {
        return this.hasErrors || this.notEnoughGas ||
            this.events.some(e => e.isError);
    }

    public get hasWarningEvent(): boolean {
        // TODO move csn and otu to events
        return this.otuExceeded || this.cnsExceeded ||
            this.events.some(e => e.isWarning);
    }

    public get endsOnSurface(): boolean {
        const wayPoints = this.wayPoints;
        const count = wayPoints.length;
        return count > 0 && wayPoints[count - 1].endDepthMeters === 0;
    }

    /** Marks dive calculation in progress, after 500 ms the not yet calculated parts are emptied */
    public start(): void {
        this.profileCalculation.start();
        this.consumptionCalculation.start();
        this.diveInfoCalculation.start();
        this._calculationFailed.set(false);

        setTimeout(() => {
            this.showStillRunning();
        }, 500);
    }

    public endFailed(): void {
        this.profileCalculation.finished();
        this.consumptionCalculation.finished();
        this.diveInfoCalculation.finished();
        this._profileState.set(emptyProfile());
        this._diveInfoState.set(emptyDiveInfo());
        this._consumptionState.set(emptyConsumption());
        this._calculationFailed.set(true);
    }

    public updateProfile(wayPoints: WayPoint[], finalTissues: LoadedTissues, profile: Segment[]): void {
        this._profileState.set({ wayPoints, finalTissues, profile });
        this.profileCalculation.finished();
    }

    public updateDiveInfo(
        noDecoTime: number,
        notEnoughTime: boolean,
        planDuration: number,
        averageDepth: number,
        surfaceGradient: number,
        offgasingStartTime: number,
        offgasingStartDepth: number,
        otu: number,
        cns: number,
        highestDensity: HighestDensity,
        ceilings: Ceiling[],
        tissueOverPressures: TissueOverPressures[],
        events: BoundEvent[],
        dailyCns: number,
        cnsExposures: CnsExposure[],
        algorithmEvents: Event[],
        tissues: Float64Array = new Float64Array(0)): void {
        this._diveInfoState.set({
            noDecoTime,
            notEnoughTime,
            planDuration,
            averageDepth,
            surfaceGradient,
            offgasingStartTime,
            offgasingStartDepth,
            otu,
            cns,
            dailyCns,
            cnsExposures,
            highestDensity,
            ceilings,
            maxCeiling: _(ceilings).maxBy(c => c.depth),
            tissueOverPressures,
            events,
            algorithmEvents,
            tissues
        });
        this.diveInfoCalculation.finished();
    }

    public updateConsumption(
        maxTime: number,
        timeToSurface: number,
        emergencyAscentStart: number,
        turnPressure: number,
        turnTime: number,
        needsReturn: boolean,
        notEnoughGas: boolean,
        emergencyAscent: WayPoint[],
        consumedGases: ConsumedGas[] = []): void {
        this._consumptionState.set({
            maxTime,
            timeToSurface,
            emergencyAscentStart,
            emergencyAscent,
            turnPressure,
            turnTime,
            needsReturn,
            notEnoughGas,
            consumedGases
        });
        this.consumptionCalculation.finished();
    }

    /** Marks each part as not calculated */
    private showStillRunning(): void {
        if(this.profileCalculation.running) {
            this._profileState.set(emptyProfile());
        }

        if(this.diveInfoCalculation.running) {
            this._diveInfoState.set(emptyDiveInfo());
        }

        if(this.consumptionCalculation.running) {
            this._consumptionState.set(emptyConsumption());
        }

        this.profileCalculation.stillRunning();
        this.consumptionCalculation.stillRunning();
        this.diveInfoCalculation.stillRunning();
    }
}
