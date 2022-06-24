import { Subject } from 'rxjs';

/** Allows calculation in background thread using web worker */
export class BackgroundTask<TRequest, TResponse> {
    public calculated;
    private onCalculated = new Subject<TResponse>();

    constructor(private worker: Worker) {
        this.calculated = this.onCalculated.asObservable();
        // TODO add worker error handling
        this.worker.addEventListener('message', (m) => this.processMessage(m));
    }

    public calculate(request: TRequest): void {
        this.worker.postMessage(request);
    }

    private processMessage(message: MessageEvent<TResponse>): void {
        this.onCalculated.next(message.data);
    }
}
