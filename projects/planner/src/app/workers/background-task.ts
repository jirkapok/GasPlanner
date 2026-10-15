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

    constructor(private worker: Worker) {
        this.calculated$ = this.onCalculated.asObservable();
        this.failed$ = this.onFailed.asObservable();
        this.worker.addEventListener('message', (m) => this.processMessage(m));
        this.worker.addEventListener('error', () => this.onFailed.next());
    }

    public calculate(request: TRequest): void {
        this.worker.postMessage(request);
    }

    private processMessage(message: MessageEvent<TResponse>): void {
        this.onCalculated.next(message.data);
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

    constructor(private createWorker: () => Worker) {
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
        worker.addEventListener('message', (m: MessageEvent<TResponse>) => this.onCalculated.next(m.data));
        worker.addEventListener('error', () => this.onFailed.next());
        return worker;
    }
}
