import { Observable, Subject } from 'rxjs';
import { Tank } from 'scuba-physics';
import { Injectable } from '@angular/core';
import { TanksService } from './tanks.service';
import { OptionsService } from './options.service';
import { DepthsService } from './depths.service';

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
    public tanksReloaded$: Observable<TanksService>;
    /** On selected dive only */
    public tankChanged$: Observable<void>;
    /** On selected dive only */
    public tankRemoved$: Observable<Tank>;
    /** On selected dive only */
    public depthChanged$: Observable<void>;
    /** On selected dive only */
    public optionsReloaded$: Observable<OptionsService>;
    /** On selected dive only */
    public optionsChanged$: Observable<void>;
    /** Only in case Reload all dives. */
    public depthsReloaded$: Observable<DepthsService>;
    /** For any finished dive */
    public infoCalculated$: Observable<number>;
    /** For selected dive only. */
    public wayPointsCalculated$: Observable<number>;
    public selectedChanged$: Observable<void>;

    private onTanksReloaded = new Subject<TanksService>();
    private onTankChanged = new Subject<void>();
    private onTankRemoved = new Subject<Tank>();
    private onDepthsReloaded = new Subject<DepthsService>();
    private onDepthChanged = new Subject<void>();
    private onOptionsReloaded = new Subject<OptionsService>();
    private onOptionsChanged = new Subject<void>();
    private onSelectedChanged = new Subject<void>();
    private onInfoCalculated = new Subject<number>();
    private onWayPointsCalculated = new Subject<number>();

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

    public sendTanksReloaded(source: TanksService): void {
        console.log('Tanks reloaded');
        this.onTanksReloaded.next(source);
    }

    public sendTanksRemoved(removed: Tank): void {
        console.log('Tank removed');
        this.onTankRemoved.next(removed);
    }

    public sendTankChanged(){
        console.log('Tank changed');
        this.onTankChanged.next();
    }

    public sendDepthChanged(): void {
        console.log('Depth changed');
        this.onDepthChanged.next();
    }

    public sendOptionsReloaded(source: OptionsService): void {
        console.log('Options reloaded');
        this.onOptionsReloaded.next(source);
    }

    public sendOptionsChanged(): void {
        console.log('Options changed');
        this.onOptionsChanged.next();
    }

    public sendSelectedChanged(newSelectedId: number): void {
        console.log(`Selected dive changed to ${newSelectedId}`);
        this.onSelectedChanged.next();
    }

    public sendDepthsReloaded(source: DepthsService): void {
        console.log('Depths reloaded');
        this.onDepthsReloaded.next(source);
    }

    public sendWayPointsCalculated(diveId: number): void {
        this.onWayPointsCalculated.next(diveId);
    }

    public sendInfoCalculated(diveId: number): void {
        this.onInfoCalculated.next(diveId);
    }
}
