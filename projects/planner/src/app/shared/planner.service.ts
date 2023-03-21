import { Injectable } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';

import { Dive } from './models';
import { Plan } from '../shared/plan.service';
import { WayPointsService } from './waypoints.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import {
    Options, Precision,
    Diver, Segments, Salinity, SafetyStop
} from 'scuba-physics';
import {
    DtoSerialization, ConsumptionResultDto, ConsumptionRequestDto,
    ProfileRequestDto, ProfileResultDto, DiveInfoResultDto
} from './serialization.model';
import { IBackgroundTask } from '../workers/background-task';
import { Streamed } from './streamed';
import { TanksService } from './tanks.service';

@Injectable()
export class PlannerService extends Streamed {
    public static readonly maxAcceptableNdl = 1000;
    // TODO diver can't be used outside of planner, serialization or app settings
    public diver: Diver = new Diver();
    // there always needs to be at least one
    public dive: Dive = new Dive();
    public infoCalculated$: Observable<void>;
    public wayPointsCalculated$: Observable<void>;

    private calculating = false;
    private calculatingDiveInfo = false;
    private calculatingProfile = false;
    private _options: Options;
    private onInfoCalculated = new Subject<void>();
    private onWayPointsCalculated = new Subject<void>();
    private profileTask: IBackgroundTask<ProfileRequestDto, ProfileResultDto>;
    private consumptionTask: IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;
    private diveInfoTask: IBackgroundTask<ProfileRequestDto, DiveInfoResultDto>;

    constructor(private workerFactory: WorkersFactoryCommon,
        private tanks: TanksService,
        private plan: Plan) {
        super();
        // TODO move to OptionsService
        this._options = new Options();
        this._options.salinity = Salinity.fresh;
        this._options.safetyStop = SafetyStop.auto;
        this.infoCalculated$ = this.onInfoCalculated.asObservable();
        this.wayPointsCalculated$ = this.onWayPointsCalculated.asObservable();

        this.profileTask = this.workerFactory.createProfileWorker();
        this.profileTask.calculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => this.continueCalculation(data));
        this.profileTask.failed$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.profileFailed());

        this.diveInfoTask = this.workerFactory.createDiveInfoWorker();
        this.diveInfoTask.calculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((calculated) => this.finishDiveInfo(calculated));
        this.diveInfoTask.failed$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.profileFailed());

        this.consumptionTask = this.workerFactory.createConsumptionWorker();
        this.consumptionTask.calculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => this.finishCalculation(data));
        this.consumptionTask.failed$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.profileFailed());
    }

    /** Gets the current options. Used only for testing purposes */
    public get options(): Options {
        return this._options;
    }

    public get ndlValid(): boolean {
        return this.dive.diveInfoCalculated && this.plan.noDecoTime < PlannerService.maxAcceptableNdl;
    }

    public applyDiver(diver: Diver): void {
        this.diver.loadFrom(diver);
    }

    public loadFrom(options: Options, diver: Diver): void {
        this.assignOptions(options);
        this.applyDiver(diver);
    }

    public assignOptions(newOptions: Options): void {
        this._options.loadFrom(newOptions);
    }

    /** Not called by default, needs to be called manually */
    public calculate(): void {
        this.startCalculatingState();

        setTimeout(() => {
            this.showStillRunning();
        }, 500);

        const profileRequest = {
            tanks: DtoSerialization.fromTanks(this.tanks.tankData),
            plan: DtoSerialization.fromSegments(this.plan.segments),
            options: DtoSerialization.fromOptions(this.options)
        };
        this.profileTask.calculate(profileRequest);
    }

    private startCalculatingState(): void {
        this.calculating = true;
        this.calculatingProfile = true;
        this.calculatingDiveInfo = true;
    }

    private endCalculatingState(): void {
        this.calculating = false;
        this.calculatingProfile = false;
        this.calculatingDiveInfo = false;
        this.dive.profileCalculated = true;
        this.dive.diveInfoCalculated = true;
        this.dive.calculated = true;
    }

    private showStillRunning(): void {
        if (this.calculatingProfile) {
            this.dive.profileCalculated = false;
            this.dive.emptyProfile();
        }

        if (this.calculatingDiveInfo) {
            this.dive.diveInfoCalculated = false;
        }

        if (this.calculating) {
            this.dive.calculated = false;
        }
    }

    private continueCalculation(result: ProfileResultDto): void {
        const serializedPlan = DtoSerialization.fromSegments(this.plan.segments);
        const tankData = this.tanks.tankData;
        const serializedTanks = DtoSerialization.fromTanks(tankData);
        const calculatedProfile = DtoSerialization.toProfile(result.profile, tankData);
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
            this.diveInfoTask.calculate(noDecoRequest);

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
            this.onWayPointsCalculated.next();
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
        this.onWayPointsCalculated.next();
        this.onInfoCalculated.next();
    }

    private finishDiveInfo(diveInfo: DiveInfoResultDto): void {
        this.plan.noDecoTime = diveInfo.noDeco;
        this.dive.otu = diveInfo.otu;
        this.dive.cns = diveInfo.cns;
        this.dive.noDecoExceeded = this.plan.noDecoExceeded;
        this.dive.notEnoughTime = this.plan.notEnoughTime;
        this.dive.diveInfoCalculated = true;
        this.calculatingDiveInfo = false;
    }

    private finishCalculation(result: ConsumptionResultDto): void {
        this.tanks.copyTanksConsumption(result.tanks);
        this.dive.maxTime = result.maxTime;
        this.dive.timeToSurface = result.timeToSurface;

        this.dive.emergencyAscentStart = this.plan.startAscentTime;
        this.dive.turnPressure = this.tanks.calculateTurnPressure();
        this.dive.turnTime = Precision.floor(this.plan.duration / 2);
        // this needs to be moved to each gas or do we have other option?
        this.dive.needsReturn = this.plan.needsReturn && this.tanks.singleTank;
        this.dive.notEnoughGas = !this.tanks.enoughGas;

        // TODO still there is an option, that some calculation is still running.
        this.dive.calculated = true;
        this.dive.calculationFailed = false;
        this.calculating = false;
        this.onInfoCalculated.next();
    }
}
