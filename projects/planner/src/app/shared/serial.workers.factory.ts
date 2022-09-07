import { ConsumptionRequestDto, ConsumptionResultDto, DiveInfoResultDto, ProfileRequestDto, ProfileResultDto } from './serialization.model';
import { IBackgroundTask } from '../workers/background-task';
import { Subject } from 'rxjs';
import { PlanningTasks } from '../workers/planning.tasks';

/** Used to avoid parallelism in tests */
export class WorkersFactoryCommon {
    public createProfileWorker(): IBackgroundTask<ProfileRequestDto, ProfileResultDto> {
        const subject = new Subject<ProfileResultDto>();
        const failedSubject = new Subject<void>();
        return {
            calculated: subject,
            calculate: (request: ProfileRequestDto): void => {
                this.tryAction((r) => PlanningTasks.calculateDecompression(r), request, subject, failedSubject);
            },
            failed: failedSubject,
        };
    }

    public createDiveInfoWorker(): IBackgroundTask<ProfileRequestDto, DiveInfoResultDto> {
        const subject = new Subject<DiveInfoResultDto>();
        const failedSubject = new Subject<void>();
        return {
            calculated: subject,
            calculate: (request: ProfileRequestDto): void => {
                this.tryAction((r) => PlanningTasks.diveInfo(r), request, subject, failedSubject);
            },
            failed: failedSubject,
        };
    }

    public createConsumptionWorker(): IBackgroundTask<ConsumptionRequestDto, ConsumptionResultDto> {
        const subject = new Subject<ConsumptionResultDto>();
        const failedSubject = new Subject<void>();
        return {
            calculated: subject,
            calculate: (request: ConsumptionRequestDto): void => {
                this.tryAction((r) => PlanningTasks.calculateConsumption(r), request, subject, failedSubject);
            },
            failed: failedSubject,
        };
    }

    /** simulate worker error reporting */
    private tryAction<TRequest, TResponse>(action: (r: TRequest) => TResponse,
        request: TRequest, subject: Subject<TResponse>, failed: Subject<void>): void {
        try {
            const result = action(request);
            subject.next(result);
        } catch {
            failed.next();
        }
    }
}
