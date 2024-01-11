import { Injectable } from '@angular/core';
import { takeUntil } from 'rxjs';
import { DiveResults } from './diveresults';
import { WayPointsService } from './waypoints.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import {
    GasDensity, CalculatedProfile,
    Precision, Segments, LoadedTissue
} from 'scuba-physics';
import {
    ConsumptionResultDto, ConsumptionRequestDto, EventOptionsDto,
    ProfileRequestDto, ProfileResultDto, DiveInfoResultDto, ITankBound
} from './serialization.model';
import { DtoSerialization } from './dtoSerialization';
import { IBackgroundTask } from '../workers/background-task';
import { Streamed } from './streamed';
import { DiveSchedule, DiveSchedules } from './dive.schedules';
import { UnitConversion } from './UnitConversion';
import { WayPoint } from './models';
import { ReloadDispatcher } from './reloadDispatcher';
import { environment } from '../../environments/environment';


@Injectable()
export class PlannerService extends Streamed {
    private profileTask: IBackgroundTask<ProfileRequestDto, ProfileResultDto>;
    private consumptionTask: IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;
    private diveInfoTask: IBackgroundTask<ProfileRequestDto, DiveInfoResultDto>;
    private waypoints: WayPointsService;

    constructor(
        private schedules: DiveSchedules,
        private dispatcher: ReloadDispatcher,
        workerFactory: WorkersFactoryCommon,
        units: UnitConversion) {
        super();

        this.waypoints = new WayPointsService(units);
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
    public calculate(diveId: number = 1): void {
        if(!this.schedules.validId(diveId)) {
            return;
        }

        if (!environment.production) {
            console.log(`Planner calculated: ${diveId}`);
        }

        const dive = this.diveById(diveId);
        const diveResult = dive.diveResult;
        diveResult.start();

        setTimeout(() => {
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
        diveResult.events = events.items;
        diveResult.finalTissues = calculatedProfile.tissues;
        diveResult.averageDepth = Segments.averageDepth(calculatedProfile.segments);

        if (diveResult.endsOnSurface) {
            this.processCalculatedProfile(calculatedProfile, dive);
        } else {
            // fires info finished before the profile finished, case of error it doesn't matter
            diveResult.endFailed();
            this.sendFailedEvents();
        }
    }

    private processCalculatedProfile(calculatedProfile: CalculatedProfile, dive: DiveSchedule) {
        const infoRequest = this.createProfileRequest(dive);
        this.diveInfoTask.calculate(infoRequest);

        const consumptionRequest = {
            diveId: dive.id,
            plan: infoRequest.plan,
            profile: DtoSerialization.fromSegments(calculatedProfile.segments),
            options: infoRequest.options,
            diver: DtoSerialization.fromDiver(dive.optionsService.getDiver()),
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
            // TODO make maxDensity configurable
            maxDensity: GasDensity.recommendedMaximum
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
        // fire events, because there will be no continuation
        // we dont know which one, so we use selected to refresh UI.
        // TODO distinguish failed state, so it stops scheduling
        // TODO add tests, that the events are fired with correct id
        const diveId = this.schedules.selected.id;
        this.dispatcher.sendWayPointsCalculated(diveId);
        this.dispatcher.sendInfoCalculated(diveId);
    }
}
