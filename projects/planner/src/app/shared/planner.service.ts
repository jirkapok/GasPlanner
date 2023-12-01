import { Injectable } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';

import { DiveResults } from './diveresults';
import { WayPointsService } from './waypoints.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import {
    GasDensity,
    Precision, Segments
} from 'scuba-physics';
import {
    ConsumptionResultDto, ConsumptionRequestDto, EventOptionsDto,
    ProfileRequestDto, ProfileResultDto, DiveInfoResultDto, ITankBound
} from './serialization.model';
import { DtoSerialization } from './dtoSerialization';
import { IBackgroundTask } from '../workers/background-task';
import { Streamed } from './streamed';
import { TanksService } from './tanks.service';
import { OptionsService } from './options.service';
import {DepthsService} from './depths.service';
import {DiveSchedules} from './dive.schedules';
import {UnitConversion} from './UnitConversion';

@Injectable()
export class PlannerService extends Streamed {
    public infoCalculated$: Observable<void>;
    public wayPointsCalculated$: Observable<void>;

    private calculating = false;
    private calculatingDiveInfo = false;
    private calculatingProfile = false;
    private onInfoCalculated = new Subject<void>();
    private onWayPointsCalculated = new Subject<void>();
    private profileTask: IBackgroundTask<ProfileRequestDto, ProfileResultDto>;
    private consumptionTask: IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;
    private diveInfoTask: IBackgroundTask<ProfileRequestDto, DiveInfoResultDto>;
    private waypoints: WayPointsService;

    constructor(private workerFactory: WorkersFactoryCommon,
        private schedules: DiveSchedules,
        units: UnitConversion) {
        super();

        this.waypoints = new WayPointsService(units);
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

    private get tanks(): TanksService {
        return this.schedules.selected.tanksService;
    }

    private get depths(): DepthsService {
        return this.schedules.selected.depths;
    }

    private get optionsService(): OptionsService {
        return this.schedules.selected.optionsService;
    }

    private get dive(): DiveResults {
        return this.schedules.selected.diveResult;
    }

    private get serializableTanks(): ITankBound[] {
        return this.tanks.tanks as ITankBound[];
    }

    /** Not called by default, needs to be called manually */
    public calculate(): void {
        this.startCalculatingState();

        setTimeout(() => {
            this.showStillRunning();
        }, 500);

        const profileRequest = {
            tanks: DtoSerialization.fromTanks(this.serializableTanks),
            plan: DtoSerialization.fromSegments(this.depths.segments),
            options: DtoSerialization.fromOptions(this.optionsService.getOptions()),
            eventOptions: this.createEventOptions()
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
        const serializedPlan = DtoSerialization.fromSegments(this.depths.segments);
        const tankData = this.tanks.tankData;
        const serializedTanks = DtoSerialization.fromTanks(this.serializableTanks);
        const calculatedProfile = DtoSerialization.toProfile(result.profile, tankData);
        const events = DtoSerialization.toEvents(result.events);
        const profile = this.waypoints.calculateWayPoints(calculatedProfile, events.items);
        this.dive.wayPoints = profile.wayPoints;
        this.dive.ceilings = profile.ceilings;
        this.dive.events = profile.events;
        this.dive.averageDepth = Segments.averageDepth(profile.origin);
        const optionsDto = DtoSerialization.fromOptions(this.optionsService.getOptions());

        if (profile.endsOnSurface) {
            const infoRequest = {
                tanks: serializedTanks,
                plan: serializedPlan,
                options: optionsDto,
                eventOptions: this.createEventOptions()
            };
            this.diveInfoTask.calculate(infoRequest);

            const consumptionRequest = {
                plan: serializedPlan,
                profile: DtoSerialization.fromSegments(profile.origin),
                options: optionsDto,
                diver: DtoSerialization.fromDiver(this.optionsService.getDiver()),
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
        this.dive.noDecoTime = diveInfo.noDeco;
        this.dive.otu = diveInfo.otu;
        this.dive.cns = diveInfo.cns;
        this.dive.planDuration = this.depths.planDuration;
        this.dive.notEnoughTime = this.depths.notEnoughTime;
        this.dive.highestDensity = DtoSerialization.toDensity(diveInfo.density);
        this.dive.diveInfoCalculated = true;
        this.calculatingDiveInfo = false;
    }

    private finishCalculation(result: ConsumptionResultDto): void {
        this.tanks.copyTanksConsumption(result.tanks);
        this.dive.maxTime = result.maxTime;
        this.dive.timeToSurface = result.timeToSurface;

        this.dive.emergencyAscentStart = this.depths.startAscentTime;
        this.dive.turnPressure = this.tanks.calculateTurnPressure();
        this.dive.turnTime = Precision.floor(this.depths.planDuration / 2);
        // this needs to be moved to each gas or do we have other option?
        this.dive.needsReturn = this.depths.needsReturn && this.tanks.singleTank;
        this.dive.notEnoughGas = !this.tanks.enoughGas;

        // TODO still there is an option, that some calculation is still running.
        this.dive.calculated = true;
        this.dive.calculationFailed = false;
        this.calculating = false;
        this.onInfoCalculated.next();
    }

    private createEventOptions(): EventOptionsDto {
        return {
            // TODO make maxDensity configurable
            maxDensity: GasDensity.recommendedMaximum
        };
    }
}
