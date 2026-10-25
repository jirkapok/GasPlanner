import { RestartableBackgroundTask } from './background-task';

/** Minimal worker replacement, records the communication with the worker thread */
class FakeWorker {
    public readonly posted: unknown[] = [];
    public terminated = false;
    private readonly listeners = new Map<string, (event: MessageEvent<string>) => void>();

    public addEventListener(type: string, listener: (event: MessageEvent<string>) => void): void {
        this.listeners.set(type, listener);
    }

    public postMessage(message: unknown): void {
        this.posted.push(message);
    }

    public terminate(): void {
        this.terminated = true;
    }

    /** Simulates message from the worker thread */
    public reply(data: string): void {
        this.listeners.get('message')?.({ data: data } as MessageEvent<string>);
    }

    /** Simulates error in the worker thread */
    public fail(): void {
        this.listeners.get('error')?.({} as MessageEvent<string>);
    }
}

describe('RestartableBackgroundTask', () => {
    let created: FakeWorker[];
    let sut: RestartableBackgroundTask<number, string>;

    const createWorker = (): Worker => {
        const worker = new FakeWorker();
        created.push(worker);
        return worker as unknown as Worker;
    };

    beforeEach(() => {
        created = [];
        sut = new RestartableBackgroundTask<number, string>(createWorker);
    });

    it('Posts request to the worker', () => {
        sut.calculate(1);
        expect(created[0].posted).toEqual([1]);
    });

    it('Streams every message of the worker', () => {
        const received: string[] = [];
        sut.calculated$.subscribe(m => received.push(m));
        created[0].reply('a');
        created[0].reply('b');
        expect(received).toEqual(['a', 'b']);
    });

    it('Cancel terminates the worker and uses new one', () => {
        sut.cancel();
        sut.calculate(2);
        expect(created[0].terminated).toBe(true);
        expect(created[1].posted).toEqual([2]);
    });

    it('Reports messages of the new worker after cancel', () => {
        const received: string[] = [];
        sut.calculated$.subscribe(m => received.push(m));
        sut.cancel();
        created[1].reply('c');
        expect(received).toEqual(['c']);
    });

    it('Ignores error of the cancelled worker', () => {
        let failures = 0;
        sut.failed$.subscribe(() => failures++);
        sut.cancel();
        created[0].fail();
        expect(failures).toEqual(0);
    });

    it('Ignores message of the cancelled worker', () => {
        const received: string[] = [];
        sut.calculated$.subscribe(m => received.push(m));
        sut.cancel();
        created[0].reply('late');
        expect(received).toEqual([]);
    });

    it('Reports error of the current worker', () => {
        let failures = 0;
        sut.failed$.subscribe(() => failures++);
        sut.cancel();
        created[1].fail();
        expect(failures).toEqual(1);
    });
});
