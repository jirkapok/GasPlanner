import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Plan, Dive, Strategies, } from './models';
import { WayPointsService } from './waypoints.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import {
    Options, Tank, Tanks,
    Diver, Segment, Segments, Salinity, SafetyStop
} from 'scuba-physics';
import {
    DtoSerialization, ConsumptionResultDto, ConsumptionRequestDto,
    ProfileRequestDto, TankDto, ProfileResultDto
} from './serialization.model';
import { IBackgroundTask } from '../workers/background-task';

@Injectable()
export class PlannerService {
    public static readonly maxAcceptableNdl = 1000;
    public isComplex = false;
    public plan: Plan;
    // TODO diver can't be used outside of planner, serialization or app settings
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
    private profileTask: IBackgroundTask<ProfileRequestDto, ProfileResultDto>;
    private consumptionTask: IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;
    private noDecoTask: IBackgroundTask<ProfileRequestDto, number>;

    constructor(private workerFactory: WorkersFactoryCommon) {
        this._options = new Options();
        this._options.salinity = Salinity.fresh;
        this._options.safetyStop = SafetyStop.auto;
        const tank = Tank.createDefault();
        tank.id = 1;
        this._tanks.push(tank);
        this.infoCalculated = this.onInfoCalculated.asObservable();
        this.wayPointsCalculated = this.onWayPointsCalculated.asObservable();
        this.plan = new Plan(Strategies.ALL, 30, 12, this.firstTank, this.options);

        this.profileTask = this.workerFactory.createProfileWorker();
        this.profileTask.calculated.subscribe((data) => this.continueCalculation(data));
        this.profileTask.failed.subscribe(() => this.profileFailed());

        this.noDecoTask = this.workerFactory.createNoDecoWorker();
        this.noDecoTask.calculated.subscribe((calculated) => this.finishNoDeco(calculated));
        this.noDecoTask.failed.subscribe(() => this.profileFailed());

        this.consumptionTask = this.workerFactory.createConsumptionWorker();
        this.consumptionTask.calculated.subscribe((data) => this.finishCalculation(data));
        this.consumptionTask.failed.subscribe(() => this.profileFailed());
    }

    /** Gets the current options. Used only for testing purposes */
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
    }

    public addTank(): void {
        const newTank = Tank.createDefault();
        newTank.size = 11;
        this._tanks.push(newTank);
        newTank.id = this._tanks.length;
    }

    public removeTank(tank: Tank): void {
        this._tanks = Tanks.removeTank(this._tanks, tank);
        this.plan.resetSegments(tank, this.firstTank);
    }

    public addSegment(): void {
        this.plan.addSegment(this.firstTank);
    }

    public removeSegment(segment: Segment): void {
        this.plan.removeSegment(segment);
    }

    public applyMaxDuration(): void {
        const newValue = this.dive.maxTime;
        this.assignDuration(newValue);
    }

    public applyNdlDuration(): void {
        const newValue = this.plan.noDecoTime;
        this.assignDuration(newValue);
    }

    public assignDuration(newDuration: number): void {
        this.plan.assignDuration(newDuration, this.firstTank, this.options);
    }

    public assignDepth(newDepth: number): void {
        this.plan.assignDepth(newDepth, this.firstTank, this.options);
    }

    public applyDiver(diver: Diver): void {
        this.diver.loadFrom(diver);
    }

    public loadFrom(isComplex: boolean, options: Options, diver: Diver, tanks: Tank[], segments: Segment[]): void {
        // TODO Apply from Units after the plan was applied, we don't need to check them
        // minimumAutoStopDepth lastStopDepth decoStopDistance
        this.assignOptions(options);
        this.diver.loadFrom(diver);

        if (tanks.length > 0) {
            this._tanks = tanks;
        }

        if (segments.length > 1) {
            this.plan.loadFrom(segments);
        }

        this.isComplex = isComplex;
        if(!isComplex) {
            this.resetToSimple();
        }
    }

    public assignOptions(newOptions: Options): void {
        this._options.loadFrom(newOptions);
    }

    /** Not called by default, needs to be called manually */
    public calculate(): void {
        this.startCalculatingState();
        // TODO calculate only if form is valid

        setTimeout(() => {
            this.showStillRunning();
        }, 500);

        const profileRequest = {
            tanks: DtoSerialization.fromTanks(this._tanks),
            plan: DtoSerialization.fromSegments(this.plan.segments),
            options: DtoSerialization.fromOptions(this.options)
        };
        this.profileTask.calculate(profileRequest);
    }

    private startCalculatingState(): void {
        this.calculating = true;
        this.calculatingProfile = true;
        this.calculatingNoDeco = true;
    }

    private endCalculatingState(): void {
        this.calculating = false;
        this.calculatingProfile = false;
        this.calculatingNoDeco = false;
        this.dive.profileCalculated = true;
        this.dive.noDecoCalculated = true;
        this.dive.calculated = true;
    }

    private showStillRunning(): void {
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
        const serializedPlan = DtoSerialization.fromSegments(this.plan.segments);
        const serializedTanks =  DtoSerialization.fromTanks(this._tanks);
        const calculatedProfile = DtoSerialization.toProfile(result.profile, this._tanks);
        const events = DtoSerialization.toEvents(result.events);
        const profile = WayPointsService.calculateWayPoints(calculatedProfile, events);
        this.dive.wayPoints = profile.wayPoints;
        this.dive.ceilings = profile.ceilings;
        this.dive.events = profile.events;
        this.dive.averageDepth = Segments.averageDepth(profile.origin);
        const optionsDto = DtoSerialization.fromOptions(this.options);

        if (profile.endsOnSurface) {
            const noDecoRequest = {
                tanks: serializedTanks,
                plan: serializedPlan,
                options: optionsDto
            };
            this.noDecoTask.calculate(noDecoRequest);

            const consumptionRequest = {
                plan: serializedPlan,
                profile: DtoSerialization.fromSegments(profile.origin),
                options: optionsDto,
                diver: DtoSerialization.fromDiver(this.diver),
                tanks: serializedTanks
            };
            this.consumptionTask.calculate(consumptionRequest);

            this.dive.profileCalculated = true;
            this.calculatingProfile = false;
            this.onWayPointsCalculated.next({});
        } else {
            // fires info finished before the profile finished, case of error it doesn't matter
            this.profileFailed();
            console.table(calculatedProfile.errors);
        }
    }

    private profileFailed(): void {
        this.dive.calculationFailed = true;
        this.dive.events = [];
        this.dive.wayPoints = [];
        this.dive.ceilings = [];
        this.endCalculatingState();
        // fire events, because there will be no continuation
        this.onWayPointsCalculated.next({});
        this.onInfoCalculated.next({});
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
        this.dive.calculationFailed = false;
        this.calculating = false;
        this.onInfoCalculated.next({});
    }

    private copyTanksConsumption(tanks: TankDto[]) {
        for(let index = 0; index < this.tanks.length; index++) {
            const source = tanks[index];
            const target = this.tanks[index];
            target.consumed = source.consumed;
            target.reserve = source.reserve;
        }
    }

    /** even in case thirds rule, the last third is reserve, so we always divide by 2 */
    private calculateTurnPressure(): number {
        const consumed = this.firstTank.consumed / 2;
        return this.firstTank.startPressure - Math.floor(consumed);
    }
}
