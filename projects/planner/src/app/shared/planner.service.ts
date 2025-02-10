import { Injectable } from '@angular/core';
import { takeUntil } from 'rxjs';
import { WayPointsService } from './waypoints.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import {
    CalculatedProfile, Precision,
    LoadedTissue
} from 'scuba-physics';
import {
    ConsumptionResultDto, ConsumptionRequestDto, EventOptionsDto,
    ProfileRequestDto, ProfileResultDto, DiveInfoResultDto, ITankBound,
    DiveInfoRequestDto, CalculatedProfileDto, PlanRequestDto
} from './serialization.model';
import { DtoSerialization } from './dtoSerialization';
import { IBackgroundTask } from '../workers/background-task';
import { Streamed } from './streamed';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { UnitConversion } from './UnitConversion';
import { ReloadDispatcher } from './reloadDispatcher';
import { Logger } from './Logger';
import { ViewSwitchService } from './viewSwitchService';
import { WayPoint } from './wayPoint';
import { ApplicationSettingsService } from './ApplicationSettings';
import { IgnoredIssuesService } from './IgnoredIssues.service';
import { BoundEvent } from "./models";


@Injectable()
export class PlannerService extends Streamed {
    private profileTask: IBackgroundTask<ProfileRequestDto, ProfileResultDto>;
    private consumptionTask: IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;
    private diveInfoTask: IBackgroundTask<DiveInfoRequestDto, DiveInfoResultDto>;
    private waypoints: WayPointsService;
    private ignoredIssues: IgnoredIssuesService;

    constructor(
        private schedules: DiveSchedules,
        private dispatcher: ReloadDispatcher,
        private viewSwitch: ViewSwitchService,
        private appSettings: ApplicationSettingsService,
        workerFactory: WorkersFactoryCommon,
        private units: UnitConversion) {
        super();

        this.waypoints = new WayPointsService(units);
        this.ignoredIssues = new IgnoredIssuesService(this.appSettings);
        this.profileTask = workerFactory.createProfileWorker();
        this.profileTask.calculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => this.continueCalculation(data));
        this.profileTask.failed$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.profileFailed());

        this.diveInfoTask = workerFactory.createDiveInfoWorker();
        this.diveInfoTask.calculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((calculated) => this.finishDiveInfo(calculated));
        this.diveInfoTask.failed$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.profileFailed());

        this.consumptionTask = workerFactory.createConsumptionWorker();
        this.consumptionTask.calculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => this.finishConsumption(data));
        this.consumptionTask.failed$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.profileFailed());
    }

    /** Not called by default, needs to be called manually */
    public calculate(diveId: number): void {
        if(!this.schedules.validId(diveId)) {
            return;
        }

        Logger.debug(`Planner calculated: ${diveId}`);
        this.schedules.markStart(diveId);
        const dive = this.schedules.byId(diveId)!;
        const profileRequest = this.createPlanRequest(dive) as ProfileRequestDto;
        this.profileTask.calculate(profileRequest);
    }

    private continueCalculation(result: ProfileResultDto): void {
        // still we may assign result to wrong dive after a dive is removed and Ids are rearranged
        // but there should be following schedule to fix it
        if(!this.schedules.validId(result.diveId)) {
            return;
        }

        const dive = this.schedules.byId(result.diveId)!;
        const tankData = dive.tanksService.tankData;
        const calculatedProfile = DtoSerialization.toProfile(result.profile, tankData);
        const diveResult = dive.diveResult;
        const wayPoints = this.wayPointsFromResult(calculatedProfile);
        diveResult.updateProfile(wayPoints, calculatedProfile.finalTissues);

        if (diveResult.endsOnSurface) {
            this.processCalculatedProfile(result.profile, dive);
        } else {
            // fires info finished before the profile finished, case of error it doesn't matter
            diveResult.endFailed();
            this.sendFailedEvents();
        }
    }

    private processCalculatedProfile(calculatedProfile: CalculatedProfileDto, dive: DiveSchedule) {
        const infoRequest = this.createPlanRequest(dive) as DiveInfoRequestDto;
        infoRequest.calculatedProfile = calculatedProfile.segments;
        infoRequest.calculatedTissues = calculatedProfile.finalTissues;
        infoRequest.eventOptions = this.createEventOptions();
        this.diveInfoTask.calculate(infoRequest);

        const previousTissues = this.schedules.previousDiveTissues(dive.id);
        const consumptionRequest = {
            diveId: dive.id,
            isComplex: this.viewSwitch.isComplex,
            plan: infoRequest.plan,
            profile: calculatedProfile.segments,
            options: infoRequest.options,
            consumptionOptions: {
                diver: DtoSerialization.fromDiver(dive.optionsService.getDiver()),
                primaryTankReserve: this.appSettings.primaryTankReserve,
                stageTankReserve: this.appSettings.stageTankReserve
            },
            tanks: infoRequest.tanks,
            tissues: previousTissues,
            surfaceInterval: dive.surfaceInterval
        };

        this.consumptionTask.calculate(consumptionRequest);
        this.dispatcher.sendWayPointsCalculated(dive.id);
    }

    private createPlanRequest(dive: DiveSchedule): PlanRequestDto {
        const previousTissues = this.schedules.previousDiveTissues(dive.id);
        const serializableTanks = dive.tanksService.tanks as ITankBound[];
        return {
            diveId: dive.id,
            tanks: DtoSerialization.fromTanks(serializableTanks),
            plan: DtoSerialization.fromSegments(dive.depths.segments),
            options: DtoSerialization.fromOptions(dive.optionsService.getOptions()),
            tissues: DtoSerialization.fromTissues(previousTissues),
            surfaceInterval: dive.surfaceInterval
        };
    }

    private wayPointsFromResult(calculatedProfile: CalculatedProfile): WayPoint[] {
        if(calculatedProfile.errors.length > 0) {
            return [];
        }

        return this.waypoints.calculateWayPoints(calculatedProfile.segments);
    }

    private profileFailed(): void {
        // We are unable to distinguish, which profile failed, so panic and reset all.
        this.schedules.dives.forEach(d => d.diveResult.endFailed());
        this.sendFailedEvents();
    }

    private finishDiveInfo(diveInfoResult: DiveInfoResultDto): void {
        if(!this.schedules.validId(diveInfoResult.diveId)) {
            return;
        }

        const dive = this.schedules.byId(diveInfoResult.diveId)!;
        const diveResult = dive.diveResult;
        const events = DtoSerialization.toEvents(diveInfoResult.events);
        const filteredEvents = this.ignoredIssues.filterIgnored(events.items)
            .map(e => new BoundEvent(this.units, e));
        const density = DtoSerialization.toDensity(diveInfoResult.density);
        diveResult.updateDiveInfo(
            diveInfoResult.noDeco,
            dive.depths.notEnoughTime,
            dive.depths.planDuration,
            diveInfoResult.averageDepth,
            diveInfoResult.surfaceGradient,
            diveInfoResult.offgasingStartTime,
            diveInfoResult.offgasingStartDepth,
            diveInfoResult.otu,
            diveInfoResult.cns,
            density,
            // ceilings and overpressures have simple data, no custom conversion needed
            diveInfoResult.ceilings,
            diveInfoResult.tissueOverPressures,
            filteredEvents
        );
        this.fireFinishedEvents(dive);
    }

    private finishConsumption(result: ConsumptionResultDto): void {
        if(!this.schedules.validId(result.diveId)) {
            return;
        }

        const dive = this.schedules.byId(result.diveId)!;
        const tanks = dive.tanksService;
        tanks.copyTanksConsumption(result.tanks);
        const diveResult = dive.diveResult;
        const turnPressure = tanks.calculateTurnPressure();
        // this needs to be moved to each gas or do we have other option?
        const needsReturn = dive.depths.needsReturn && tanks.singleTank;
        const turnTime = Precision.floor(dive.depths.planDuration / 2);

        diveResult.updateConsumption(
            result.maxTime,
            result.timeToSurface,
            dive.depths.startAscentTime,
            turnPressure,
            turnTime,
            needsReturn,
            !tanks.enoughGas
        );

        this.fireFinishedEvents(dive);
    }

    private createEventOptions(): EventOptionsDto {
        return {
            maxDensity: this.appSettings.settings.maxGasDensity
        };
    }

    private fireFinishedEvents(dive: DiveSchedule) {
        if(!dive.diveResult.running) {
            this.dispatcher.sendInfoCalculated(dive.id);
        }
    }

    private sendFailedEvents(): void {
        // Fire events, because there will be no continuation.
        // But we dont know which one.
        // It is Ok to send waypoints calculated, since they are already set to empty.
        this.dispatcher.sendWayPointsCalculated();
        this.dispatcher.sendInfoCalculated();
    }
}
