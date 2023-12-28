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
    // TODO move calculating flags to dive
    private calculating = false;
    private calculatingDiveInfo = false;
    private calculatingProfile = false;
    private profileTask: IBackgroundTask<ProfileRequestDto, ProfileResultDto>;
    private consumptionTask: IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>;
    private diveInfoTask: IBackgroundTask<ProfileRequestDto, DiveInfoResultDto>;
    private waypoints: WayPointsService;

    constructor(
        private workerFactory: WorkersFactoryCommon,
        private schedules: DiveSchedules,
        private dispatcher: ReloadDispatcher,
        units: UnitConversion) {
        super();

        this.waypoints = new WayPointsService(units);
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

    /** Not called by default, needs to be called manually */
    public calculate(diveId: number = 1): void {
        if(!this.schedules.validId(diveId)) {
            return;
        }

        this.startCalculatingState();

        setTimeout(() => {
            this.showStillRunning(diveId);
        }, 500);

        const diveResult = this.diveResult(diveId);
        const profileRequest = this.createProfileRequest(diveResult.finalTissues, diveId);
        this.profileTask.calculate(profileRequest);
    }

    private startCalculatingState(): void {
        this.calculating = true;
        this.calculatingProfile = true;
        this.calculatingDiveInfo = true;
    }

    private endCalculatingState(diveId: number): void {
        this.calculating = false;
        this.calculatingProfile = false;
        this.calculatingDiveInfo = false;
        const dive = this.diveResult(diveId);
        dive.profileCalculated = true;
        dive.diveInfoCalculated = true;
        dive.calculated = true;
    }

    private showStillRunning(diveId: number): void {
        const dive = this.diveResult(diveId);

        if (this.calculatingProfile) {
            dive.profileCalculated = false;
            dive.emptyProfile();
        }

        if (this.calculatingDiveInfo) {
            dive.diveInfoCalculated = false;
        }

        if (this.calculating) {
            dive.calculated = false;
        }
    }

    private continueCalculation(result: ProfileResultDto): void {
        if(!this.schedules.validId(result.diveId)) {
            return;
        }

        const dive = this.diveBy(result.diveId);
        const tankData = dive.tanksService.tankData;
        const calculatedProfile = DtoSerialization.toProfile(result.profile, tankData);
        const events = DtoSerialization.toEvents(result.events);
        const diveResult = this.diveResult(result.diveId);
        diveResult.wayPoints = this.wayPointsFromResult(calculatedProfile);
        diveResult.ceilings = calculatedProfile.ceilings;
        diveResult.events = events.items;
        diveResult.finalTissues = calculatedProfile.tissues;
        diveResult.averageDepth = Segments.averageDepth(calculatedProfile.segments);

        if (diveResult.endsOnSurface) {
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
            this.consumptionTask.calculate(consumptionRequest);

            diveResult.profileCalculated = true;
            this.calculatingProfile = false;
            this.dispatcher.sendWayPointsCalculated();
        } else {
            // fires info finished before the profile finished, case of error it doesn't matter
            this.profileFailed(result.diveId);
            console.table(calculatedProfile.errors);
        }
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

    // TODO profileFailed, but for which dive?
    private profileFailed(diveId: number = 1): void {
        const dive = this.diveResult(diveId);
        dive.calculationFailed = true;
        dive.events = [];
        dive.wayPoints = [];
        dive.ceilings = [];
        this.endCalculatingState(diveId);
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
        diveResult.diveInfoCalculated = true;
        this.calculatingDiveInfo = false;
    }

    private finishCalculation(result: ConsumptionResultDto): void {
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

        // TODO still there is an option, that some calculation is still running.
        diveResult.calculated = true;
        diveResult.calculationFailed = false;
        this.calculating = false;
        this.dispatcher.sendInfoCalculated();
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
