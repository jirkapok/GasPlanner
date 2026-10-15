import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, takeUntil } from 'rxjs';
import { DiveSchedule, DiveSchedules } from '../dive.schedules';
import { ReloadDispatcher } from '../reloadDispatcher';
import { Streamed } from '../streamed';
import { ComputerData } from './computer.model';
import { ComputerProfile } from './computerProfile';

/**
 * Source data for the dive computer simulator.
 * Keeps its own dive selection (first dive by default), independent of the planner selected dive,
 * and keeps computer data of the selected dive up to date.
 */
@Injectable()
export class ComputerProfileService extends Streamed {
    public readonly computerData$: Observable<ComputerData>;
    private _selectedDive: DiveSchedule;
    private readonly onComputerData: BehaviorSubject<ComputerData>;

    constructor(private schedules: DiveSchedules, private dispatcher: ReloadDispatcher) {
        super();
        this._selectedDive = this.schedules.dives[0];
        this.onComputerData = new BehaviorSubject<ComputerData>(this.calculate());
        this.computerData$ = this.onComputerData.asObservable();

        this.dispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((diveId) => this.diveCalculated(diveId));

        // In case dive removed
        this.dispatcher.depthChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.resetIfRemoved());
    }

    /** The dive selected within this service, the current computer data was calculated from */
    public get selectedDive(): DiveSchedule {
        return this._selectedDive;
    }

    public get selectedIndex(): number {
        return this._selectedDive.index;
    }

    public get computerData(): ComputerData {
        return this.onComputerData.value;
    }

    private get selectedRemoved(): boolean {
        return !this.schedules.dives.includes(this._selectedDive);
    }

    public select(index: number): void {
        const dives = this.schedules.dives;

        if (index < 0 || index >= dives.length || dives[index] === this._selectedDive) {
            return;
        }

        this._selectedDive = dives[index];
        this.refresh();
    }

    private diveCalculated(diveId?: number): void {
        // dives may be cleared and reloaded without depth changed event
        if (this.selectedRemoved) {
            this.selectFirst();
            return;
        }

        if (diveId === undefined || diveId === this._selectedDive.id) {
            this.refresh();
        }
    }

    private resetIfRemoved(): void {
        if (this.selectedRemoved) {
            this.selectFirst();
        }
    }

    private selectFirst(): void {
        this._selectedDive = this.schedules.dives[0];
        this.refresh();
    }

    private refresh(): void {
        this.onComputerData.next(this.calculate());
    }

    private calculate(): ComputerData {
        const results = this._selectedDive.diveResult;

        if (results.failed || !results.profileCalculated || !results.diveInfoCalculated) {
            return ComputerProfile.empty();
        }

        return ComputerProfile.calculate(results);
    }
}
