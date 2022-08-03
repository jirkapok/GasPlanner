import { Observable, Subject } from 'rxjs';

export interface IBackgroundTask<TRequest, TResponse> {
    calculated: Observable<TResponse>;
    failed: Observable<void>;
    calculate(request: TRequest): void;
}

/** Allows calculation in background thread using web worker */
export class BackgroundTask<TRequest, TResponse> implements IBackgroundTask<TRequest, TResponse> {
    public calculated: Observable<TResponse>;
    public failed: Observable<void>;
    private onCalculated = new Subject<TResponse>();
    private onFailed = new Subject<void>();

    constructor(private worker: Worker) {
        this.calculated = this.onCalculated.asObservable();
        this.failed = this.onFailed.asObservable();
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
