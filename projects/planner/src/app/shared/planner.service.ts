import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Plan, Dive, Strategies, } from './models';
import { WayPointsService } from './waypoints.service';
import {
    NitroxCalculator, Options,
    DepthConverter, DepthConverterFactory, Tank, Tanks,
    Diver, Segment, Segments, OptionDefaults, Salinity, SafetyStop,
    DepthLevels, Gas
} from 'scuba-physics';
import {
    DtoSerialization, ConsumptionResultDto, ConsumptionRequestDto,
    ProfileRequestDto, TankConsumedDto, ProfileResultDto
} from './serialization.model';
import { BackgroundTask } from './background-task';

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
    private calculating = false;
    private calculatingNoDeco = false;
    private calculatingProfile = false;
    private _tanks: Tank[] = [];
    private _options: Options;
    private onInfoCalculated = new Subject();
    private onWayPointsCalculated = new Subject();
    private depthConverterFactory: DepthConverterFactory;
    private depthConverter!: DepthConverter;
    private nitroxCalculator!: NitroxCalculator;
    private profileTask: BackgroundTask<ProfileRequestDto, ProfileResultDto>;
    private consumptionTask: BackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;
    private noDecoTask: BackgroundTask<ProfileRequestDto, number>;

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

        const profileWorker = new Worker(new URL('../workers/profile.worker', import.meta.url));
        this.profileTask = new BackgroundTask<ProfileRequestDto, ProfileResultDto>(profileWorker);
        this.profileTask.calculated.subscribe((data) => {
            this.continueCalculation(data);
        });

        const noDecoWorker = new Worker(new URL('../workers/no-deco.worker', import.meta.url));
        this.noDecoTask = new BackgroundTask<ProfileRequestDto, number>(noDecoWorker);
        this.noDecoTask.calculated.subscribe((calculated) => {
            this.finishNoDeco(calculated);
        });

        const consumptionWorker = new Worker(new URL('../workers/consumption.worker', import.meta.url));
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
        return this.dive.noDecoCalculated && this.plan.noDecoTime < PlannerService.maxAcceptableNdl;
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
        this.calculating = true;
        this.calculatingProfile = true;
        this.calculatingNoDeco = true;
        // TODO calculate only if form is valid
        // TODO Fix unit tests

        setTimeout(() => {
            this.showStillRunning();
        }, 500);

        // TODO copy options to diver only on app startup, let it customize per dive
        this.options.maxPpO2 = this.diver.maxPpO2;
        this.options.maxDecoPpO2 = this.diver.maxDecoPpO2;
        this.resetDepthConverter();

        const serializedPlan = DtoSerialization.toSegmentPreferences(this.plan.segments);
        const serializedTanks =  DtoSerialization.toTankPreferences(this._tanks);

        const profileRequest = {
            tanks: serializedTanks,
            plan: serializedPlan,
            options: this.options
        };
        this.profileTask.calculate(profileRequest);
    }

    private showStillRunning(): void {
        // TODO Fix when calculation is requested before the currently running is finished
        if(this.calculatingProfile) {
            this.dive.profileCalculated = false;
            this.dive.emptyProfile();
        }

        if(this.calculatingNoDeco) {
            this.dive.noDecoCalculated = false;
        }

        if(this.calculating) {
            this.dive.calculated = false;
        }
    }

    private continueCalculation(result: ProfileResultDto): void {
        const serializedPlan = DtoSerialization.toSegmentPreferences(this.plan.segments);
        const serializedTanks =  DtoSerialization.toTankPreferences(this._tanks);
        const calculatedProfile = DtoSerialization.toProfile(result.profile, this._tanks);
        // TODO Fix data property of events, looks like deserialization doesn't work
        const profile = WayPointsService.calculateWayPoints(calculatedProfile, result.events);
        this.dive.wayPoints = profile.wayPoints;
        this.dive.ceilings = profile.ceilings;
        this.dive.events = profile.events;
        this.dive.averageDepth = Segments.averageDepth(profile.origin);

        if (profile.endsOnSurface) {

            const noDecoRequest = {
                tanks: serializedTanks,
                plan: serializedPlan,
                options: this.options
            };
            this.noDecoTask.calculate(noDecoRequest);

            const consumptionRequest = {
                plan: serializedPlan,
                profile: DtoSerialization.toSegmentPreferences(profile.origin),
                options: this.options,
                diver: this.diver,
                tanks: serializedTanks
            };

            this.consumptionTask.calculate(consumptionRequest);
        } else {
            // TODO provide error values to calculated profile
        }

        this.dive.profileCalculated = true;
        this.calculatingProfile = false;
        this.onWayPointsCalculated.next({});
    }

    private finishNoDeco(noDeco: number): void {
        this.plan.noDecoTime = noDeco;
        this.dive.noDecoExceeded = this.plan.noDecoExceeded;
        this.dive.notEnoughTime = this.plan.notEnoughTime;
        this.dive.noDecoCalculated = true;
        this.calculatingNoDeco = false;
    }

    private finishCalculation(result: ConsumptionResultDto): void {
        this.copyTanksConsumption(result.tanks);
        this.dive.maxTime = result.maxTime;
        this.dive.timeToSurface = result.timeToSurface;

        this.dive.emergencyAscentStart = this.plan.startAscentTime;
        this.dive.turnPressure = this.calculateTurnPressure();
        this.dive.turnTime = Math.floor(this.plan.duration / 2);
        // this needs to be moved to each gas or do we have other option?
        this.dive.needsReturn = this.plan.needsReturn && this._tanks.length === 1;
        this.dive.notEnoughGas = !Tanks.haveReserve(this._tanks);

        this.dive.calculated = true;
        this.calculating = false;
        this.onInfoCalculated.next({});
    }

    private copyTanksConsumption(tanks: TankConsumedDto[]) {
        for(let index = 0; index < this.tanks.length; index++) {
            const source = tanks[index];
            const target = this.tanks[index];
            target.consumed = source.consumed;
            target.reserve = source.reserve;
        }
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
