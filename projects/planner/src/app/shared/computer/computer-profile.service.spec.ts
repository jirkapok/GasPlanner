import { TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';
import { HighestDensity, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { ReloadDispatcher } from '../reloadDispatcher';
import { UnitConversion } from '../UnitConversion';
import { WayPoint } from '../wayPoint';
import { WorkersFactoryCommon } from '../serial.workers.factory';
import { IRestartableTask } from '../../workers/background-task';
import { ComputerRequestDto, ComputerResultDto } from '../serialization.model';
import { ComputerData, RunTimePoint } from './computer.model';
import { ComputerProfileService } from './computer-profile.service';

/** Replaces the worker, the test decides what the worker reports */
class FakeComputerTask implements IRestartableTask<ComputerRequestDto, ComputerResultDto> {
    public readonly requests: ComputerRequestDto[] = [];
    public cancelled = 0;
    public readonly calculated = new Subject<ComputerResultDto>();
    public readonly failed = new Subject<void>();
    public readonly calculated$: Observable<ComputerResultDto> = this.calculated;
    public readonly failed$: Observable<void> = this.failed;

    public get lastRequest(): ComputerRequestDto {
        return this.requests[this.requests.length - 1];
    }

    public calculate(request: ComputerRequestDto): void {
        this.requests.push(request);
    }

    public cancel(): void {
        this.cancelled++;
    }
}

class FakeWorkersFactory extends WorkersFactoryCommon {
    public readonly computerTask = new FakeComputerTask();

    public createComputerWorker(): IRestartableTask<ComputerRequestDto, ComputerResultDto> {
        return this.computerTask;
    }
}

describe('ComputerProfileService', () => {
    let sut: ComputerProfileService;
    let schedules: DiveSchedules;
    let dispatcher: ReloadDispatcher;
    let units: UnitConversion;
    let worker: FakeComputerTask;
    let published: ComputerData[];
    let progress: number[];

    /** Simulates PlannerService finishing calculation of a dive with given duration in seconds */
    const calculate = (dive: DiveSchedule, duration: number): void => {
        const results = dive.diveResult;
        results.start();
        results.updateProfile([WayPoint.fromSegment(units, new Segment(0, 0, StandardGases.air, duration))],
            ProfileTissues.createAtSurface(0));
        results.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], []);
        results.updateConsumption(0, 0, 0, 0, 0, false, false, []);
        dispatcher.sendInfoCalculated(dive.id);
    };

    const point = (runTime: number): RunTimePoint => ({
        runTime: runTime, depth: 0, maxDepth: 0, averageDepth: 0, ceiling: 0, ndl: 0, tts: 0
    });

    /** Reports started with given total, then the points, for the last request */
    const report = (total: number, points: RunTimePoint[], finish: boolean): void => {
        const calculationId = worker.lastRequest.calculationId;
        worker.calculated.next({ calculationId: calculationId, type: 'started', total: total, events: [] });
        points.forEach((p, index) => worker.calculated.next({ calculationId: calculationId, type: 'point', index: index, point: p }));

        if (finish) {
            worker.calculated.next({ calculationId: calculationId, type: 'finished' });
        }
    };

    const lastPublished = (): ComputerData => published[published.length - 1];
    const lastProgress = (): number => progress[progress.length - 1];

    beforeEach(() => {
        const workers = new FakeWorkersFactory();
        worker = workers.computerTask;
        TestBed.configureTestingModule({
            providers: [
                ComputerProfileService, DiveSchedules, ReloadDispatcher, UnitConversion,
                { provide: WorkersFactoryCommon, useValue: workers }
            ]
        });

        schedules = TestBed.inject(DiveSchedules);
        dispatcher = TestBed.inject(ReloadDispatcher);
        units = TestBed.inject(UnitConversion);
        sut = TestBed.inject(ComputerProfileService);
        published = [];
        progress = [];
        sut.computerData$.subscribe(d => published.push(d));
        sut.progress$.subscribe(p => progress.push(p));
    });

    describe('Selection', () => {
        it('Selects first dive by default', () => {
            expect(sut.selectedDive).toBe(schedules.dives[0]);
            expect(sut.selectedIndex).toEqual(0);
        });

        it('Selects first dive by default even if planner selected another dive', () => {
            schedules.add(); // DiveSchedules.add selects the added dive in the planner
            const newSut = new ComputerProfileService(schedules, dispatcher, new FakeWorkersFactory());
            expect(newSut.selectedDive).toBe(schedules.dives[0]);
        });

        it('Ignores calculation of not selected dive', () => {
            const second = schedules.add();
            calculate(second, 10);
            expect(worker.requests.length).toEqual(0);
            expect(sut.selectedDive).toBe(schedules.dives[0]);
        });

        it('Calculates other dive when selected', () => {
            const second = schedules.add();
            calculate(second, 20);
            sut.select(1);
            expect(sut.selectedDive).toBe(second);
            expect(sut.selectedIndex).toEqual(1);
            expect(worker.lastRequest.diveId).toEqual(second.id);
        });

        it('Selecting already selected dive does not recalculate', () => {
            calculate(schedules.dives[0], 10);
            const countBefore = worker.requests.length;
            sut.select(0);
            expect(worker.requests.length).toEqual(countBefore);
        });

        it('Ignores out of range selection', () => {
            const countBefore = published.length;
            sut.select(-1);
            sut.select(1);
            expect(sut.selectedIndex).toEqual(0);
            expect(published.length).toEqual(countBefore);
        });

        it('Ignores planner selection', () => {
            schedules.add();
            const countBefore = published.length;
            schedules.setSelectedIndex(1); // fires selectedChanged$
            expect(sut.selectedDive).toBe(schedules.dives[0]);
            expect(published.length).toEqual(countBefore);
        });

        it('Selects first dive when selected dive removed', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            const second = schedules.add();
            calculate(second, 30);
            sut.select(1);
            schedules.remove(second); // fires depthChanged$
            expect(sut.selectedDive).toBe(first);
            expect(worker.lastRequest.diveId).toEqual(first.id);
        });

        it('Keeps selection when other dive removed', () => {
            const second = schedules.add();
            const third = schedules.add();
            calculate(third, 30);
            sut.select(2);
            const countBefore = worker.requests.length;
            schedules.remove(second);
            expect(sut.selectedDive).toBe(third);
            expect(sut.selectedIndex).toEqual(1);
            expect(worker.requests.length).toEqual(countBefore);
        });

        it('Selects first dive when selected dive cleared without depth change event', () => {
            schedules.add();
            sut.select(1);
            schedules.clear(); // used when all dives are reloaded, fires no event
            calculate(schedules.dives[0], 10);
            expect(sut.selectedDive).toBe(schedules.dives[0]);
            expect(worker.lastRequest.diveId).toEqual(schedules.dives[0].id);
        });
    });

    describe('Calculation', () => {
        it('Does not calculate not calculated dive', () => {
            expect(worker.requests.length).toEqual(0);
            expect(lastPublished().profile).toEqual([]);
            expect(lastProgress()).toEqual(0);
        });

        it('Starts calculation with plan of selected dive when calculated', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            expect(worker.lastRequest.diveId).toEqual(first.id);
            expect(worker.lastRequest.plan.length).toEqual(first.depths.segments.length);
        });

        it('Does not calculate failed dive', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            first.diveResult.endFailed();
            dispatcher.sendInfoCalculated(first.id);
            expect(worker.requests.length).toEqual(1);
            expect(lastPublished().profile).toEqual([]);
        });

        it('Collects streamed points', () => {
            calculate(schedules.dives[0], 10);
            report(2, [point(0), point(1)], true);
            expect(sut.computerData.profile.map(p => p.runTime)).toEqual([0, 1]);
            expect(lastPublished().profile.length).toEqual(2);
        });

        it('Updates progress for every point and ends at 100 %', () => {
            calculate(schedules.dives[0], 10);
            report(4, [point(0), point(1)], false);
            expect(progress.slice(-2)).toEqual([25, 50]);
            worker.calculated.next({ calculationId: worker.lastRequest.calculationId, type: 'finished' });
            expect(lastProgress()).toEqual(100);
        });

        it('New calculation interrupts the running one and resets data and progress', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            const previousId = worker.lastRequest.calculationId;
            report(4, [point(0)], false);
            calculate(first, 20);
            expect(worker.cancelled).toEqual(1);
            expect(worker.lastRequest.calculationId).not.toEqual(previousId);
            expect(sut.computerData.profile).toEqual([]);
            expect(lastProgress()).toEqual(0);
        });

        it('Ignores messages of interrupted calculation', () => {
            const first = schedules.dives[0];
            calculate(first, 10);
            const previousId = worker.lastRequest.calculationId;
            calculate(first, 20);
            worker.calculated.next({ calculationId: previousId, type: 'point', index: 0, point: point(0) });
            expect(sut.computerData.profile).toEqual([]);
            expect(lastProgress()).toEqual(0);
        });

        it('Selected dive change interrupts the running calculation', () => {
            const second = schedules.add();
            calculate(second, 20);
            calculate(schedules.dives[0], 10);
            sut.select(1);
            expect(worker.cancelled).toEqual(1);
            expect(worker.lastRequest.diveId).toEqual(second.id);
        });

        it('Worker failure resets data and ends progress', () => {
            calculate(schedules.dives[0], 10);
            report(4, [point(0)], false);
            worker.failed.next();
            expect(sut.computerData.profile).toEqual([]);
            expect(lastProgress()).toEqual(100);
        });
    });
});
