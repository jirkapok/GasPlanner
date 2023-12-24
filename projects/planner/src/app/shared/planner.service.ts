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
import { TanksService } from './tanks.service';
import { OptionsService } from './options.service';
import { DepthsService } from './depths.service';
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

    private get tanks(): TanksService {
        return this.schedules.selected.tanksService;
    }

    private get depths(): DepthsService {
        return this.schedules.selected.depths;
    }

    private get optionsService(): OptionsService {
        return this.schedules.selected.optionsService;
    }

    /** Not called by default, needs to be called manually */
    public calculate(diveId: number = 1): void {
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
        const tankData = this.tanks.tankData;
        const calculatedProfile = DtoSerialization.toProfile(result.profile, tankData);
        const events = DtoSerialization.toEvents(result.events);
        const dive = this.diveResult(result.diveId);
        dive.wayPoints = this.wayPointsFromResult(calculatedProfile);
        dive.ceilings = calculatedProfile.ceilings;
        dive.events = events.items;
        dive.finalTissues = calculatedProfile.tissues;
        dive.averageDepth = Segments.averageDepth(calculatedProfile.segments);

        if (dive.endsOnSurface) {
            const infoRequest = this.createProfileRequest(calculatedProfile.tissues, result.diveId);
            this.diveInfoTask.calculate(infoRequest);

            const consumptionRequest = {
                diveId: result.diveId,
                plan: infoRequest.plan,
                profile: DtoSerialization.fromSegments(calculatedProfile.segments),
                options: infoRequest.options,
                diver: DtoSerialization.fromDiver(this.optionsService.getDiver()),
                tanks: infoRequest.tanks
            };
            this.consumptionTask.calculate(consumptionRequest);

            dive.profileCalculated = true;
            this.calculatingProfile = false;
            this.dispatcher.sendWayPointsCalculated();
        } else {
            // fires info finished before the profile finished, case of error it doesn't matter
            this.profileFailed(result.diveId);
            console.table(calculatedProfile.errors);
        }
    }

    private createProfileRequest(previousDivetissues: LoadedTissue[], diveId: number): ProfileRequestDto {
        const serializableTanks = this.tanks.tanks as ITankBound[];
        return {
            diveId: diveId,
            tanks: DtoSerialization.fromTanks(serializableTanks),
            plan: DtoSerialization.fromSegments(this.depths.segments),
            options: DtoSerialization.fromOptions(this.optionsService.getOptions()),
            tissues: DtoSerialization.fromTissues(previousDivetissues),
            surfaceInterval: this.schedules.selected.surfaceInterval,
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
    private profileFailed(diveId: number = 0): void {
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

    private finishDiveInfo(diveInfoResultDto: DiveInfoResultDto): void {
        const dive = this.diveResult(diveInfoResultDto.diveId);
        dive.noDecoTime = diveInfoResultDto.noDeco;
        dive.otu = diveInfoResultDto.otu;
        dive.cns = diveInfoResultDto.cns;
        dive.planDuration = this.depths.planDuration;
        dive.notEnoughTime = this.depths.notEnoughTime;
        dive.highestDensity = DtoSerialization.toDensity(diveInfoResultDto.density);
        dive.diveInfoCalculated = true;
        this.calculatingDiveInfo = false;
    }

    // TODO add testcase: dive is removed before its info is calculated
    private finishCalculation(result: ConsumptionResultDto): void {
        this.tanks.copyTanksConsumption(result.tanks);
        const dive = this.diveResult(result.diveId);
        dive.maxTime = result.maxTime;
        dive.timeToSurface = result.timeToSurface;

        dive.emergencyAscentStart = this.depths.startAscentTime;
        dive.turnPressure = this.tanks.calculateTurnPressure();
        dive.turnTime = Precision.floor(this.depths.planDuration / 2);
        // this needs to be moved to each gas or do we have other option?
        dive.needsReturn = this.depths.needsReturn && this.tanks.singleTank;
        dive.notEnoughGas = !this.tanks.enoughGas;

        // TODO still there is an option, that some calculation is still running.
        dive.calculated = true;
        dive.calculationFailed = false;
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
