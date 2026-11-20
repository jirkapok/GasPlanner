import { Signal, signal } from '@angular/core';
import { TissueOverPressures } from 'scuba-physics';
import { IRestartableTask } from '../workers/background-task';
import { RestIntervalRequestDto, RestIntervalResultDto } from './serialization.model';
import { DiveResults } from './diveresults';
import { DtoSerialization } from './dtoSerialization';

/**
 * Heatmap tissues of one dive including the rest interval after the dive.
 * The rest interval part is calculated in background, previous tissues are kept until the new ones are calculated.
 * Results are not stored in the dive results, since they are used only by the heatmap.
 */
export class RestIntervalTissues {
    private readonly _overPressures = signal<TissueOverPressures[]>([]);
    private diveTissues: TissueOverPressures[] = [];
    /** only result of the latest request is applied */
    private awaitingResult = false;

    constructor(private task: IRestartableTask<RestIntervalRequestDto, RestIntervalResultDto>) {
        this.task.calculated$.subscribe((result) => this.applyResult(result));
        this.task.failed$.subscribe(() => this.applyFailure());
    }

    /** dive tissues followed by the rest interval tissues */
    public get overPressures(): Signal<TissueOverPressures[]> {
        return this._overPressures.asReadonly();
    }

    /**
     * @param dive calculated dive
     * @param altitude m.a.s.l. where the diver rests
     * @param restInterval in seconds
     */
    public calculate(dive: DiveResults, altitude: number, restInterval: number): void {
        this.cancel();

        // final tissues may already belong to new profile, while the over pressures are still from previous dive info
        if (!dive.diveInfoCalculated) {
            return;
        }

        this.diveTissues = dive.tissueOverPressures;

        if (restInterval <= 0 || !dive.endsOnSurface) {
            this.publish([]);
            return;
        }

        this.awaitingResult = true;
        this.task.calculate({
            tissues: DtoSerialization.fromTissues(dive.finalTissues),
            altitude: altitude,
            restInterval: restInterval
        });
    }

    /** Drops running calculation, e.g. while new profile is calculated, previous tissues are kept */
    public cancel(): void {
        this.task.cancel();
        this.awaitingResult = false;
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
        this.publish(result.tissueOverPressures);
    }

    /** at least the dive part is shown */
    private applyFailure(): void {
        if (!this.awaitingResult) {
            return;
        }

        this.awaitingResult = false;
        this.publish([]);
    }

    /** new array, so every calculation redraws the heat map */
    private publish(restTissues: TissueOverPressures[]): void {
        this._overPressures.set([...this.diveTissues, ...restTissues]);
    }
}
