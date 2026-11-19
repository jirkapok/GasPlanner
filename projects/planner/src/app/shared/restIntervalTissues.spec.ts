import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { HighestDensity, ProfileTissues, Segment, StandardGases, TissueOverPressures } from 'scuba-physics';
import { RestIntervalTissues } from './restIntervalTissues';
import { IRestartableTask } from '../workers/background-task';
import { RestIntervalRequestDto, RestIntervalResultDto } from './serialization.model';
import { DiveResults } from './diveresults';
import { WayPoint } from './wayPoint';
import { UnitConversion } from './UnitConversion';

class FakeRestIntervalTask implements IRestartableTask<RestIntervalRequestDto, RestIntervalResultDto> {
    public readonly calculated$ = new Subject<RestIntervalResultDto>();
    public readonly failed$ = new Subject<void>();
    public readonly calls: string[] = [];
    public readonly requests: RestIntervalRequestDto[] = [];

    public calculate(request: RestIntervalRequestDto): void {
        this.calls.push('calculate');
        this.requests.push(request);
    }

    public cancel(): void {
        this.calls.push('cancel');
    }

    public terminate(): void {
        this.calls.push('terminate');
    }

    public respond(...rows: TissueOverPressures[]): void {
        this.calculated$.next({ tissueOverPressures: rows });
    }
}

describe('RestIntervalTissues', () => {
    const row = (value: number): TissueOverPressures => new Array<number>(16).fill(value) as TissueOverPressures;
    const diveRow = row(1);
    let task: FakeRestIntervalTask;
    let sut: RestIntervalTissues;

    const createDive = (endDepth: number, withInfo: boolean): DiveResults => {
        const dive = new DiveResults();
        const segment = new Segment(30, endDepth, StandardGases.air, 600);
        dive.updateProfile([WayPoint.fromSegment(TestBed.inject(UnitConversion), segment)], ProfileTissues.createAtSurface(0), [segment]);

        if (withInfo) {
            dive.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [diveRow], [], 0, [], []);
        }

        return dive;
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [UnitConversion] });
        task = new FakeRestIntervalTask();
        sut = new RestIntervalTissues(task);
    });

    it('is empty while dive info is not calculated', () => {
        sut.calculate(createDive(0, false), 0, 1800);

        expect(sut.overPressures()).toEqual([]);
        expect(task.requests).toEqual([]);
    });

    it('shows dive tissues immediately', () => {
        sut.calculate(createDive(0, true), 0, 1800);

        expect(sut.overPressures()).toEqual([diveRow]);
    });

    it('requests the rest interval with tissues at end of the dive', () => {
        sut.calculate(createDive(0, true), 500, 1800);

        expect(task.requests.length).toBe(1);
        expect(task.requests[0].altitude).toBe(500);
        expect(task.requests[0].restInterval).toBe(1800);
        expect(task.requests[0].tissues.length).toBe(16);
    });

    it('appends rest interval tissues when calculated', () => {
        sut.calculate(createDive(0, true), 0, 1800);

        task.respond(row(2), row(3));

        expect(sut.overPressures()).toEqual([diveRow, row(2), row(3)]);
    });

    it('does not request for zero rest interval', () => {
        sut.calculate(createDive(0, true), 0, 0);

        expect(sut.overPressures()).toEqual([diveRow]);
        expect(task.requests).toEqual([]);
    });

    it('does not request when dive does not end on surface', () => {
        sut.calculate(createDive(10, true), 0, 1800);

        expect(sut.overPressures()).toEqual([diveRow]);
        expect(task.requests).toEqual([]);
    });

    it('cancels running calculation on new request', () => {
        sut.calculate(createDive(0, true), 0, 1800);
        sut.calculate(createDive(0, true), 0, 3600);

        expect(task.calls).toEqual(['cancel', 'calculate', 'cancel', 'calculate']);
    });

    it('ignores result of outdated request', () => {
        sut.calculate(createDive(0, true), 0, 1800);
        sut.calculate(createDive(0, true), 0, 0);

        task.respond(row(2));

        expect(sut.overPressures()).toEqual([diveRow]);
    });

    it('dispose terminates the background task', () => {
        sut.dispose();

        expect(task.calls).toEqual(['terminate']);
    });

    it('keeps dive tissues when calculation fails', () => {
        sut.calculate(createDive(0, true), 0, 1800);

        task.failed$.next();
        task.respond(row(2));

        expect(sut.overPressures()).toEqual([diveRow]);
    });
});
