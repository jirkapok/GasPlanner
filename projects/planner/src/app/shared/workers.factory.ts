import {
    ConsumptionRequestDto,
    ConsumptionResultDto,
    DiveInfoRequestDto,
    DiveInfoResultDto,
    ProfileRequestDto,
    ProfileResultDto
} from './serialization.model';
import { BackgroundTask, IBackgroundTask } from '../workers/background-task';
import { WorkersFactoryCommon } from './serial.workers.factory';

export class WorkersFactory extends WorkersFactoryCommon {
    public createProfileWorker(): IBackgroundTask<ProfileRequestDto, ProfileResultDto> {
        const profileWorker = new Worker(new URL('../workers/profile.worker', import.meta.url));
        return new BackgroundTask<ProfileRequestDto, ProfileResultDto>(profileWorker);
    }

    public createDiveInfoWorker(): IBackgroundTask<DiveInfoRequestDto, DiveInfoResultDto> {
        const diveInfoWorker = new Worker(new URL('../workers/diveInfo.worker', import.meta.url));
        return new BackgroundTask<DiveInfoRequestDto, DiveInfoResultDto>(diveInfoWorker);
    }

    public createConsumptionWorker(): IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto> {
        const consumptionWorker = new Worker(new URL('../workers/consumption.worker', import.meta.url));
        return new BackgroundTask<ConsumptionRequestDto, ConsumptionResultDto>(consumptionWorker);
    }
}
