import { Injectable } from '@angular/core';
import { takeUntil } from 'rxjs';
import _ from 'lodash';

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

        const dive = this.diveResult(diveId);
        dive.start();

        setTimeout(() => {
            dive.showStillRunning();
        }, 500);

        const diveResult = this.diveResult(diveId);
        const profileRequest = this.createProfileRequest(diveResult.finalTissues, diveId);
        this.profileTask.calculate(profileRequest);
    }

    private continueCalculation(result: ProfileResultDto): void {
        if(!this.schedules.validId(result.diveId)) {
            return;
        }

        const dive = this.diveBy(result.diveId);
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
            this.processCalculatedProfile(calculatedProfile, result, dive);
        } else {
            // fires info finished before the profile finished, case of error it doesn't matter
            diveResult.endFailed();
            this.sendEvents();
        }
    }

    private processCalculatedProfile(calculatedProfile: CalculatedProfile, result: ProfileResultDto, dive: DiveSchedule) {
        const infoRequest = this.createProfileRequest(calculatedProfile.tissues, result.diveId);
        this.diveInfoTask.calculate(infoRequest);

        const consumptionRequest = {
            diveId: result.diveId,
            plan: infoRequest.plan,
            profile: DtoSerialization.fromSegments(calculatedProfile.segments),
            options: infoRequest.options,
            diver: DtoSerialization.fromDiver(dive.optionsService.getDiver()),
            tanks: infoRequest.tanks
        };

        dive.diveResult.profileFinished();
        this.dispatcher.sendWayPointsCalculated();
        this.consumptionTask.calculate(consumptionRequest);
    }

    private createProfileRequest(previousDivetissues: LoadedTissue[], diveId: number): ProfileRequestDto {
        const dive = this.diveBy(diveId);
        const serializableTanks = dive.tanksService.tanks as ITankBound[];
        return {
            diveId: diveId,
            tanks: DtoSerialization.fromTanks(serializableTanks),
            plan: DtoSerialization.fromSegments(dive.depths.segments),
            options: DtoSerialization.fromOptions(dive.optionsService.getOptions()),
            tissues: DtoSerialization.fromTissues(previousDivetissues),
            surfaceInterval: dive.surfaceInterval,
            eventOptions: this.createEventOptions()
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
        this.sendEvents();
    }

    private sendEvents(): void {
        // fire events, because there will be no continuation
        this.dispatcher.sendWayPointsCalculated();
        this.dispatcher.sendInfoCalculated();
    }

    private finishDiveInfo(diveInfoResult: DiveInfoResultDto): void {
        if(!this.schedules.validId(diveInfoResult.diveId)) {
            return;
        }

        const dive = this.diveBy(diveInfoResult.diveId);
        const diveResult = dive.diveResult;
        diveResult.noDecoTime = diveInfoResult.noDeco;
        diveResult.otu = diveInfoResult.otu;
        diveResult.cns = diveInfoResult.cns;
        diveResult.planDuration = dive.depths.planDuration;
        diveResult.notEnoughTime = dive.depths.notEnoughTime;
        diveResult.highestDensity = DtoSerialization.toDensity(diveInfoResult.density);
        diveResult.diveInfoFinished();

        if(diveResult.calculated) {
            this.dispatcher.sendInfoCalculated();
        }
    }

    private finishConsumption(result: ConsumptionResultDto): void {
        if(!this.schedules.validId(result.diveId)) {
            return;
        }

        const dive = this.diveBy(result.diveId);
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

        if(diveResult.calculated) {
            this.dispatcher.sendInfoCalculated();
        }
    }

    private createEventOptions(): EventOptionsDto {
        return {
            // TODO make maxDensity configurable
            maxDensity: GasDensity.recommendedMaximum
        };
    }

    private diveResult(diveId: number): DiveResults {
        return this.diveBy(diveId).diveResult;
    }
    private diveBy(diveId: number): DiveSchedule {
        const found = _(this.schedules.dives)
            .filter(d => d.id === diveId)
            .first();

        if(found) {
            return found;
        }

        return this.schedules.dives[0];
    }
}
