import { ConsumptionRequestDto, ConsumptionResultDto, ProfileRequestDto, ProfileResultDto } from './serialization.model';
import { IBackgroundTask } from '../workers/background-task';
import { Subject } from 'rxjs';
import { PlanningTasks } from '../workers/planning.tasks';

/** Used to avoid parallelism in tests */
export class WorkersFactoryCommon {
    public createProfileWorker(): IBackgroundTask<ProfileRequestDto, ProfileResultDto> {
        const subject = new Subject<ProfileResultDto>();
        return {
            calculated: subject,
            calculate: (request: ProfileRequestDto) => {
                const result = PlanningTasks.calculateDecompression(request);
                subject.next(result);
            },
        };
    }

    public createNoDecoWorker(): IBackgroundTask<ProfileRequestDto, number> {
        const subject = new Subject<number>();
        return {
            calculated: subject,
            calculate: (request: ProfileRequestDto) => {
                const result = PlanningTasks.noDecoTime(request);
                subject.next(result);
            },
        };
    }

    public createConsumptionWorker(): IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto> {
        const subject = new Subject<ConsumptionResultDto>();
        return {
            calculated: subject,
            calculate: (request: ConsumptionRequestDto) => {
                const result = PlanningTasks.calculateConsumption(request);
                subject.next(result);
            },
        };
    }
}
