import { Observable, Subject } from 'rxjs';
import { Tank} from 'scuba-physics';
import { Injectable } from '@angular/core';
import { DiveSchedule } from './dive.schedules';

/**
 * Since we show only the selected dive schedule,
 * we are always reloading properties of selected dive to the UI.
 */
@Injectable()
export class ReloadDispatcher {
    /**
     *  Event fired only in case of tanks rebuild (loadFrom or resetToSimple) on selected dive.
     *  Not fired when adding or removing tanks.
     **/
    public tanksReloaded$: Observable<void>;
    /** On selected dive only */
    public tankChanged$: Observable<void>;
    /** On selected dive only */
    public tankRemoved$: Observable<Tank>;
    /** Only in case Reload all dives. */
    public depthsReloaded$: Observable<void>;
    /** On selected dive only */
    public depthChanged$: Observable<void>;
    /** On selected dive only */
    public optionsReloaded$: Observable<void>;
    /** On selected dive only */
    public optionsChanged$: Observable<void>;
    /** On selected dive only */
    public selectedChanged$: Observable<void>;
    /** For any finished dive */
    public infoCalculated$: Observable<number>;
    /** For selected dive only. */
    public wayPointsCalculated$: Observable<void>;

    private onTanksReloaded = new Subject<void>();
    private onTankChanged = new Subject<void>();
    private onTankRemoved = new Subject<Tank>();
    private onDepthsReloaded = new Subject<void>();
    private onDepthChanged = new Subject<void>();
    private onOptionsReloaded = new Subject<void>();
    private onOptionsChanged = new Subject<void>();
    private onSelectedChanged = new Subject<void>();
    private onInfoCalculated = new Subject<number>();
    private onWayPointsCalculated = new Subject<void>();

    /**
    * to prevent circular dependency on DiveSchedules,
    * we remember it when its value is changing.
    * Used to prevent firing events in case updating not selected dive
    */
    private lastSelectedId = 1;

    constructor() {
        this.tanksReloaded$ = this.onTanksReloaded.asObservable();
        this.tankRemoved$ = this.onTankRemoved.asObservable();
        this.tankChanged$ = this.onTankChanged.asObservable();
        this.depthsReloaded$ = this.onDepthsReloaded.asObservable();
        this.depthChanged$ = this.onDepthChanged.asObservable();
        this.optionsReloaded$ = this.onOptionsReloaded.asObservable();
        this.optionsChanged$ = this.onOptionsChanged.asObservable();
        this.selectedChanged$ = this.onSelectedChanged.asObservable();
        this.infoCalculated$ = this.onInfoCalculated.asObservable();
        this.wayPointsCalculated$ = this.onWayPointsCalculated.asObservable();
    }

    public sendTanksReloaded(): void {
        console.log('Tanks reloaded');
        this.onTanksReloaded.next();
    }

    public sendTanksRemoved(removed: Tank): void {
        console.log('Tank removed');
        this.onTankRemoved.next(removed);
    }

    public sendTankChanged(){
        console.log('Tank changed');
        this.onTankChanged.next();
    }

    public sendDepthsReloaded(): void {
        console.log('Depths reloaded');
        this.onDepthsReloaded.next();
    }

    public sendDepthChanged(): void {
        console.log('Depth changed');
        this.onDepthChanged.next();
    }

    public sendOptionsReloaded(): void {
        console.log('Options reloaded');
        this.onOptionsReloaded.next();
    }

    public sendOptionsChanged(): void {
        console.log('Options changed');
        this.onOptionsChanged.next();
    }

    // TODO use lastSelected to check when firing events
    public sendSelectedChanged(newSelected: DiveSchedule): void {
        this.lastSelectedId = newSelected.id;
        console.log(`Selected dive changed to ${newSelected.id}`);
        this.onSelectedChanged.next();
    }

    public sendWayPointsCalculated(): void {
        this.onWayPointsCalculated.next();
    }

    public sendInfoCalculated(diveId: number): void {
        this.onInfoCalculated.next(diveId);
    }
}
