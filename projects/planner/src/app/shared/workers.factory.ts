import { Injectable } from '@angular/core';
import {
    ComputerRequestDto,
    ComputerResultDto,
    ConsumptionRequestDto,
    ConsumptionResultDto,
    DiveInfoRequestDto,
    DiveInfoResultDto,
    ProfileRequestDto,
    ProfileResultDto
} from './serialization.model';
import {
    BackgroundTask, IBackgroundTask,
    IRestartableTask, RestartableBackgroundTask
} from '../workers/background-task';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { ViewRefresh } from './viewRefresh';

@Injectable()
export class WorkersFactory extends WorkersFactoryCommon {
    constructor(private viewRefresh: ViewRefresh) {
        super();
    }

    public createProfileWorker(): IBackgroundTask<ProfileRequestDto, ProfileResultDto> {
        const profileWorker = new Worker(new URL('../workers/profile.worker', import.meta.url));
        return new BackgroundTask<ProfileRequestDto, ProfileResultDto>(profileWorker, this.refreshView());
    }

    public createDiveInfoWorker(): IBackgroundTask<DiveInfoRequestDto, DiveInfoResultDto> {
        const diveInfoWorker = new Worker(new URL('../workers/diveInfo.worker', import.meta.url));
        return new BackgroundTask<DiveInfoRequestDto, DiveInfoResultDto>(diveInfoWorker, this.refreshView());
    }

    public createConsumptionWorker(): IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto> {
        const consumptionWorker = new Worker(new URL('../workers/consumption.worker', import.meta.url));
        return new BackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>(consumptionWorker, this.refreshView());
    }

    public createComputerWorker(): IRestartableTask<ComputerRequestDto, ComputerResultDto> {
        return new RestartableBackgroundTask<ComputerRequestDto, ComputerResultDto>(
            () => new Worker(new URL('../workers/computer.worker', import.meta.url)), this.refreshView());
    }

    /** worker messages arrive outside Angular events, so each of them refreshes the view */
    private refreshView(): () => void {
        return () => this.viewRefresh.refresh();
    }
}
