import { Observable, Subject } from 'rxjs';

export interface IBackgroundTask<TRequest, TResponse> {
    calculated$: Observable<TResponse>;
    failed$: Observable<void>;
    calculate(request: TRequest): void;
}

/** Allows calculation in background thread using web worker */
export class BackgroundTask<TRequest, TResponse> implements IBackgroundTask<TRequest, TResponse> {
    public calculated$: Observable<TResponse>;
    public failed$: Observable<void>;
    private onCalculated = new Subject<TResponse>();
    private onFailed = new Subject<void>();

    /** afterMessage is called after subscribers processed each message or failure, e.g. to refresh the view */
    constructor(private worker: Worker, private afterMessage: () => void = () => {}) {
        this.calculated$ = this.onCalculated.asObservable();
        this.failed$ = this.onFailed.asObservable();
        this.worker.addEventListener('message', (m) => this.processMessage(m));
        this.worker.addEventListener('error', () => this.processFailure());
    }

    public calculate(request: TRequest): void {
        this.worker.postMessage(request);
    }

    private processMessage(message: MessageEvent<TResponse>): void {
        this.onCalculated.next(message.data);
        this.afterMessage();
    }

    private processFailure(): void {
        this.onFailed.next();
        this.afterMessage();
    }
}

export interface IRestartableTask<TRequest, TResponse> extends IBackgroundTask<TRequest, TResponse> {
    /** Stops running calculation, its remaining results are not reported */
    cancel(): void;
}

/** Background task streaming all messages of the worker, which can interrupt running calculation by replacing the worker */
export class RestartableBackgroundTask<TRequest, TResponse> implements IRestartableTask<TRequest, TResponse> {
    public calculated$: Observable<TResponse>;
    public failed$: Observable<void>;
    private onCalculated = new Subject<TResponse>();
    private onFailed = new Subject<void>();
    private worker: Worker;

    /** afterMessage is called after subscribers processed each message or failure of the current worker */
    constructor(private createWorker: () => Worker, private afterMessage: () => void = () => {}) {
        this.calculated$ = this.onCalculated.asObservable();
        this.failed$ = this.onFailed.asObservable();
        this.worker = this.startWorker();
    }

    public calculate(request: TRequest): void {
        this.worker.postMessage(request);
    }

    public cancel(): void {
        this.worker.terminate();
        this.worker = this.startWorker();
    }

    private startWorker(): Worker {
        const worker = this.createWorker();
        // events already queued by a cancelled worker don't belong to the current calculation
        const isCurrent = (): boolean => worker === this.worker;

        worker.addEventListener('message', (m: MessageEvent<TResponse>) => {
            if (isCurrent()) {
                this.onCalculated.next(m.data);
                this.afterMessage();
            }
        });

        worker.addEventListener('error', () => {
            if (isCurrent()) {
                this.onFailed.next();
                this.afterMessage();
            }
        });

        return worker;
    }
}
