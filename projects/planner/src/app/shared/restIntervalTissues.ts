import { Signal, signal } from '@angular/core';
import { TissueOverPressures } from 'scuba-physics';
import { IRestartableTask } from '../workers/background-task';
import { RestIntervalRequestDto, RestIntervalResultDto } from './serialization.model';
import { DiveResults } from './diveresults';
import { DtoSerialization } from './dtoSerialization';

/**
 * Heatmap tissues of one dive including the rest interval after the dive.
 * The dive part is published immediately, the rest interval part is calculated in background and appended later.
 * Results are not stored in the dive results, since they are used only by the heatmap.
 */
export class RestIntervalTissues {
    private readonly _overPressures = signal<TissueOverPressures[]>([]);
    private diveTissues: TissueOverPressures[] = [];
    /** only result of the latest request is applied */
    private awaitingResult = false;

    constructor(private task: IRestartableTask<RestIntervalRequestDto, RestIntervalResultDto>) {
        this.task.calculated$.subscribe((result) => this.applyResult(result));
        this.task.failed$.subscribe(() => this.awaitingResult = false);
    }

    /** dive tissues, later extended by the rest interval tissues */
    public get overPressures(): Signal<TissueOverPressures[]> {
        return this._overPressures.asReadonly();
    }

    /**
     * @param dive calculated dive
     * @param altitude m.a.s.l. where the diver rests
     * @param restInterval in seconds
     */
    public calculate(dive: DiveResults, altitude: number, restInterval: number): void {
        this.task.cancel();
        this.awaitingResult = false;
        // final tissues may already belong to new profile, while the over pressures are still from previous dive info
        this.diveTissues = dive.diveInfoCalculated ? dive.tissueOverPressures : [];
        // new array, so every calculation redraws the heat map
        this._overPressures.set([...this.diveTissues]);

        if (!dive.diveInfoCalculated || restInterval <= 0 || !dive.endsOnSurface) {
            return;
        }

        this.awaitingResult = true;
        this.task.calculate({
            tissues: DtoSerialization.fromTissues(dive.finalTissues),
            altitude: altitude,
            restInterval: restInterval
        });
    }

    /** No tissues shown, e.g. while new profile is calculated, running calculation result is dropped */
    public clear(): void {
        this.task.cancel();
        this.awaitingResult = false;
        this.diveTissues = [];
        this._overPressures.set([]);
    }

    /** Stops the background task, call when the owner is destroyed */
    public dispose(): void {
        this.task.terminate();
    }

    private applyResult(result: RestIntervalResultDto): void {
        if (!this.awaitingResult) {
            return;
        }

        this.awaitingResult = false;
        this._overPressures.set([...this.diveTissues, ...result.tissueOverPressures]);
    }
}
