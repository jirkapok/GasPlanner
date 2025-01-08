import { Injectable } from '@angular/core';
import { takeUntil } from 'rxjs';
import { DiveResults } from './diveresults';
import { WayPointsService } from './waypoints.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import {
    CalculatedProfile, Precision,
    Segments, LoadedTissue
} from 'scuba-physics';
import {
    ConsumptionResultDto, ConsumptionRequestDto, EventOptionsDto,
    ProfileRequestDto, ProfileResultDto, DiveInfoResultDto, ITankBound,
    DiveInfoRequestDto, SegmentDto
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


@Injectable()
export class PlannerService extends Streamed {
    private profileTask: IBackgroundTask<ProfileRequestDto, ProfileResultDto>;
    private consumptionTask: IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;
    private diveInfoTask: IBackgroundTask<ProfileRequestDto, DiveInfoResultDto>;
    private waypoints: WayPointsService;
    private ignoredIssues: IgnoredIssuesService;

    constructor(
        private schedules: DiveSchedules,
        private dispatcher: ReloadDispatcher,
        private viewSwitch: ViewSwitchService,
        private appSettings: ApplicationSettingsService,
        workerFactory: WorkersFactoryCommon,
        units: UnitConversion) {
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
        const dive = this.diveById(diveId);
        const diveResult = dive.diveResult;
        diveResult.start();

        setTimeout(() => {
            // TODO mark all following dives not calculated immediately
            diveResult.showStillRunning();
        }, 500);

        const profileRequest = this.createProfileRequest(dive);
        this.profileTask.calculate(profileRequest);
    }

    private continueCalculation(result: ProfileResultDto): void {
        // still we may assign result to wrong dive after a dive is removed and Ids are rearranged
        // but there should be following schedule to fix it
        if(!this.schedules.validId(result.diveId)) {
            return;
        }

        const dive = this.diveById(result.diveId);
        const tankData = dive.tanksService.tankData;
        const calculatedProfile = DtoSerialization.toProfile(result.profile, tankData);
        const events = DtoSerialization.toEvents(result.events);
        const diveResult = dive.diveResult;
        diveResult.wayPoints = this.wayPointsFromResult(calculatedProfile);
        diveResult.ceilings = calculatedProfile.ceilings;
        diveResult.events = this.ignoredIssues.filterIgnored(events.items);
        diveResult.finalTissues = calculatedProfile.tissues;
        diveResult.tissueOverPressures = calculatedProfile.tissueOverPressures;

        if (diveResult.endsOnSurface) {
            this.processCalculatedProfile(result.profile.segments, dive);
        } else {
            // fires info finished before the profile finished, case of error it doesn't matter
            diveResult.endFailed();
            this.sendFailedEvents();
        }
    }

    private processCalculatedProfile(calculatedProfile: SegmentDto[], dive: DiveSchedule) {
        const infoRequest = this.createProfileRequest(dive) as DiveInfoRequestDto;
        infoRequest.calculatedProfile = calculatedProfile;
        this.diveInfoTask.calculate(infoRequest);

        const consumptionRequest = {
            diveId: dive.id,
            isComplex: this.viewSwitch.isComplex,
            plan: infoRequest.plan,
            profile: calculatedProfile,
            options: infoRequest.options,
            consumptionOptions: {
                diver: DtoSerialization.fromDiver(dive.optionsService.getDiver()),
                primaryTankReserve: this.appSettings.primaryTankReserve,
                stageTankReserve: this.appSettings.stageTankReserve
            },
            tanks: infoRequest.tanks
        };

        dive.diveResult.profileFinished();
        this.consumptionTask.calculate(consumptionRequest);
        this.dispatcher.sendWayPointsCalculated(dive.id);
    }

    private createProfileRequest(dive: DiveSchedule): ProfileRequestDto {
        const previousTissues = this.previousDiveTissues(dive.id);
        const serializableTanks = dive.tanksService.tanks as ITankBound[];
        return {
            diveId: dive.id,
            tanks: DtoSerialization.fromTanks(serializableTanks),
            plan: DtoSerialization.fromSegments(dive.depths.segments),
            options: DtoSerialization.fromOptions(dive.optionsService.getOptions()),
            tissues: DtoSerialization.fromTissues(previousTissues),
            surfaceInterval: dive.surfaceInterval,
            eventOptions: this.createEventOptions()
        };
    }

    private previousDiveTissues(diveId: number): LoadedTissue[] {
        if(diveId > 1) {
            const previousDiveId = diveId - 1;
            return this.diveResult(previousDiveId).finalTissues;
        }

        return [];
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

        const dive = this.diveById(diveInfoResult.diveId);
        const diveResult = dive.diveResult;
        diveResult.noDecoTime = diveInfoResult.noDeco;
        diveResult.otu = diveInfoResult.otu;
        diveResult.cns = diveInfoResult.cns;
        diveResult.planDuration = dive.depths.planDuration;
        diveResult.notEnoughTime = dive.depths.notEnoughTime;
        diveResult.highestDensity = DtoSerialization.toDensity(diveInfoResult.density);
        diveResult.averageDepth = diveInfoResult.averageDepth;
        diveResult.surfaceGradient = diveInfoResult.surfaceGradient;
        diveResult.offgasingStart = diveInfoResult.offgasingStart;
        diveResult.diveInfoFinished();
        this.fireFinishedEvents(dive);
    }

    private finishConsumption(result: ConsumptionResultDto): void {
        if(!this.schedules.validId(result.diveId)) {
            return;
        }

        const dive = this.diveById(result.diveId);
        const tanks = dive.tanksService;
        tanks.copyTanksConsumption(result.tanks);
        const diveResult = dive.diveResult;
        diveResult.maxTime = result.maxTime;
        diveResult.timeToSurface = result.timeToSurface;

        diveResult.emergencyAscentStart = dive.depths.startAscentTime;
        diveResult.turnPressure = tanks.calculateTurnPressure();
        diveResult.turnTime = Precision.floor(dive.depths.planDuration / 2);
        // this needs to be moved to each gas or do we have other option?
        diveResult.needsReturn = dive.depths.needsReturn && tanks.singleTank;
        diveResult.notEnoughGas = !tanks.enoughGas;
        diveResult.consumptionFinished();
        this.fireFinishedEvents(dive);
    }

    private createEventOptions(): EventOptionsDto {
        return {
            maxDensity: this.appSettings.settings.maxGasDensity
        };
    }

    private diveResult(diveId: number): DiveResults {
        return this.diveById(diveId).diveResult;
    }

    private diveById(diveId: number): DiveSchedule {
        const found = this.schedules.byId(diveId);

        if(found) {
            return found;
        }

        throw new Error(`Unable to find dive by Id '${ diveId }'.`);
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
