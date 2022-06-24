import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Plan, Dive, Strategies, } from './models';
import { WayPointsService } from './waypoints.service';
import {
    NitroxCalculator, BuhlmannAlgorithm, Options,
    DepthConverter, DepthConverterFactory, Tank, Tanks,
    Diver, Segment, Gases,
    Segments, OptionDefaults, Salinity, SafetyStop,
    DepthLevels, Gas
} from 'scuba-physics';
import { DtoSerialization, ConsumptionResultDto, ConsumptionRequestDto, SegmentDto, TankDto } from './serialization.model';

@Injectable()
export class PlannerService {
    public static readonly maxAcceptableNdl = 1000;
    public isComplex = false;
    public plan: Plan;
    public diver: Diver = new Diver();
    // there always needs to be at least one
    public dive: Dive = new Dive();
    public infoCalculated;
    public wayPointsCalculated;
    private _tanks: Tank[] = [];
    private _options: Options;
    private onInfoCalculated = new Subject();
    private onWayPointsCalculated = new Subject();
    private depthConverterFactory: DepthConverterFactory;
    private depthConverter!: DepthConverter;
    private nitroxCalculator!: NitroxCalculator;
    private consumptionTask: BackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;

    constructor() {
        this._options = new Options();
        this._options.salinity = Salinity.fresh;
        this._options.safetyStop = SafetyStop.auto;
        this.depthConverterFactory = new DepthConverterFactory(this.options);
        this.resetDepthConverter();
        const tank = Tank.createDefault();
        tank.id = 1;
        this._tanks.push(tank);
        this.infoCalculated = this.onInfoCalculated.asObservable();
        this.wayPointsCalculated = this.onWayPointsCalculated.asObservable();
        this.plan = new Plan(Strategies.ALL, 30, 12, this.firstTank, this.options);

        const consumptionWorker = new Worker(new URL('../workers/plan.worker', import.meta.url));
        this.consumptionTask = new BackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>(consumptionWorker);
        this.consumptionTask.calculated.subscribe((data) => {
            this.finishCalculation(data);
        });
    }

    public get firstGasMaxDepth(): number {
        const roundedNarc = this.mndForGas(this.firstTank.gas);
        const minFound = Math.min(roundedNarc, this.gasMod);
        return Math.floor(minFound);
    }

    public get gasMod(): number {
        return this.modForGas(this.firstTank);
    }

    public get options(): Options {
        return this._options;
    }
    public get tanks(): Tank[] {
        return this._tanks;
    }

    /** only for recreational diver use case */
    public get firstTank(): Tank {
        return this._tanks[0];
    }

    public get ndlValid(): boolean {
        return this.dive.calculated && this.plan.noDecoTime < PlannerService.maxAcceptableNdl;
    }

    public static noDecoTime(tanksDto: TankDto[], originProfileDto: SegmentDto[], options: Options): number {

        // we can't speedup the prediction from already obtained profile,
        // since it may happen, the deco starts during ascent.
        // we cant use the maxDepth, because its purpose is only for single level dives
        const tanks = DtoSerialization.toTanks(tanksDto);
        const gases = Gases.fromTanks(tanks);
        const originProfile = DtoSerialization.toSegments(originProfileDto, tanks);
        const segments = Segments.fromCollection(originProfile);
        const algorithm = new BuhlmannAlgorithm();
        const noDecoLimit = algorithm.noDecoLimitMultiLevel(segments, gases, options);
        return noDecoLimit;
    }

    public resetToSimple(): void {
        // reset only gas and depths to values valid for simple view.
        this._tanks = this._tanks.slice(0, 1);

        if (this.firstTank.he > 0) {
            this.firstTank.assignStandardGas('Air');
        }

        this.plan.setSimple(this.plan.maxDepth, this.plan.duration, this.firstTank, this.options);
        this.setMediumConservatism();
    }

    public setMediumConservatism(): void {
        OptionDefaults.setMediumConservatism(this.options);
    }

    public addTank(): void {
        const newTank = Tank.createDefault();
        newTank.size = 11;
        this._tanks.push(newTank);
        newTank.id = this._tanks.length;
        this.calculate();
    }

    public removeTank(tank: Tank): void {
        this._tanks = Tanks.removeTank(this._tanks, tank);
        this.plan.resetSegments(tank, this.firstTank);
        this.calculate();
    }

    public addSegment(): void {
        this.plan.addSegment(this.firstTank);
        this.calculate();
    }

    public removeSegment(segment: Segment): void {
        this.plan.removeSegment(segment);
        this.calculate();
    }

    public changeWaterType(salinity: Salinity): void {
        this.options.salinity = salinity;
        this.calculate();
    }

    public changeSafetyStop(safetyStop: SafetyStop): void {
        this.options.safetyStop = safetyStop;
        this.calculate();
    }

    public applyMaxDepth(): void {
        this.assignDepth(this.firstGasMaxDepth);
    }

    public applyMaxDuration(): void {
        const newValue = this.dive.maxTime;
        this.assignDuration(newValue);
    }

    public applyNdlDuration(): void {
        const newValue = this.plan.noDecoTime;
        this.assignDuration(newValue);
    }

    public bestNitroxMix(): number {
        const maxPpO2 = this.options.maxPpO2;
        const o2 = this.nitroxCalculator.bestMix(maxPpO2, this.plan.maxDepth);
        return Math.round(o2);
    }

    public switchDepth(gas: Tank): number {
        return this.nitroxCalculator.gasSwitch(this.diver.maxDecoPpO2, gas.o2);
    }

    public modForGas(gas: Tank): number {
        return this.nitroxCalculator.mod(this.diver.maxPpO2, gas.o2);
    }

    public mndForGas(gas: Gas): number {
        const depthInBars = this.depthConverter.toBar(this.options.maxEND);
        const maxNarcBar = gas.mnd(depthInBars, this.options.oxygenNarcotic);
        const maxNarcDepth = this.depthConverter.fromBar(maxNarcBar);
        // because of javascript numbers precision we need to help our self
        const roundedNarc = Math.round(maxNarcDepth * 100) / 100;
        return roundedNarc;
    }

    public assignDuration(newDuration: number): void {
        this.plan.assignDuration(newDuration, this.firstTank, this.options);
        this.calculate();
    }

    public assignDepth(newDepth: number): void {
        this.plan.assignDepth(newDepth, this.firstTank, this.options);
        this.calculate();
    }

    public loadFrom(isComplex: boolean, options: Options, diver: Diver, tanks: Tank[], segments: Segment[]): void {
        this.isComplex = isComplex;
        this.assignOptions(options);
        this.diver.loadFrom(diver);

        if (tanks.length > 0) {
            this._tanks = tanks;
        }

        if (segments.length > 1) {
            this.plan.loadFrom(segments);
        }

        this.calculate();
    }

    public calculate(): void {
        // TODO calculate only if form is valid
        this.dive.calculated = false;
        // TODO copy options to diver only on app startup, let it customize per dive
        this.options.maxPpO2 = this.diver.maxPpO2;
        this.options.maxDecoPpO2 = this.diver.maxDecoPpO2;
        this.resetDepthConverter();

        const serializedPlan = DtoSerialization.toSegmentPreferences(this.plan.segments);
        const serializedTanks =  DtoSerialization.toTankPreferences(this._tanks);

        // TODO move to worker
        const profile = WayPointsService.calculateWayPoints(this.plan, this._tanks, this.options);
        this.dive.wayPoints = profile.wayPoints;
        this.dive.ceilings = profile.ceilings;
        this.dive.events = profile.events;
        this.dive.averageDepth = Segments.averageDepth(profile.origin);

        if (profile.endsOnSurface) {
            this.plan.noDecoTime = PlannerService.noDecoTime(serializedTanks, serializedPlan, this.options);

            const request = {
                plan: serializedPlan,
                profile: DtoSerialization.toSegmentPreferences(profile.origin),
                options: this.options,
                diver: this.diver,
                tanks: serializedTanks
            };

            this.consumptionTask.calculate(request);
        } else {
            // TODO provide error values to calculated profile
        }

        this.onWayPointsCalculated.next({});
    }

    private finishCalculation(result: ConsumptionResultDto): void {
        // TODO update tanks consumption from result
        this.dive.maxTime = result.maxTime;
        this.dive.timeToSurface = result.timeToSurface;

        this.dive.notEnoughTime = this.plan.notEnoughTime;
        this.dive.emergencyAscentStart = this.plan.startAscentTime;
        this.dive.turnPressure = this.calculateTurnPressure();
        this.dive.turnTime = Math.floor(this.plan.duration / 2);
        // this needs to be moved to each gas or do we have other option?
        this.dive.needsReturn = this.plan.needsReturn && this._tanks.length === 1;
        this.dive.notEnoughGas = !Tanks.haveReserve(this._tanks);
        this.dive.noDecoExceeded = this.plan.noDecoExceeded;
        this.dive.calculated = true;
        this.onInfoCalculated.next({});
    }

    private assignOptions(newOptions: Options): void {
        this._options.loadFrom(newOptions);
        this.depthConverterFactory = new DepthConverterFactory(newOptions);
        this.resetDepthConverter();
    }

    /** even in case thirds rule, the last third is reserve, so we always divide by 2 */
    private calculateTurnPressure(): number {
        const consumed = this.firstTank.consumed / 2;
        return this.firstTank.startPressure - Math.floor(consumed);
    }

    private resetDepthConverter(): void {
        this.depthConverter = this.depthConverterFactory.create();
        const depthLevels = new DepthLevels(this.depthConverter, this.options);
        this.nitroxCalculator = new NitroxCalculator(depthLevels, this.depthConverter);
    }
}

/** Allows calculation in background thread using web worker */
export class BackgroundTask<TRequest, TResponse> {
    public calculated;
    private onCalculated = new Subject<TResponse>();

    constructor(private worker: Worker) {
        this. calculated = this.onCalculated.asObservable();
        // TODO add worker error handling
        this.worker.addEventListener('message', (m) => this.processMessage(m));
    }

    public calculate(request: TRequest): void {
        this.worker.postMessage(request);
    }

    private processMessage(message: MessageEvent<TResponse>): void {
        this.onCalculated.next(message.data);
    }
}

