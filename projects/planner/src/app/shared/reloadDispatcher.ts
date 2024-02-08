import { Observable, Subject } from 'rxjs';
import { Tank } from 'scuba-physics';
import { Injectable } from '@angular/core';
import { TanksService } from './tanks.service';
import { OptionsService } from './options.service';
import { DepthsService } from './depths.service';
import { Logger } from './Logger';

/**
 * Since we show only the selected dive schedule,
 * we are always reloading properties of selected dive to the UI.
 * This fixes issue with reregistering events after selected dive changed.
 */
@Injectable()
export class ReloadDispatcher {
    /**
     *  Event fired only in case of tanks rebuild (loadFrom or resetToSimple) on selected dive.
     **/
    public tanksReloaded$: Observable<TanksService>;
    /** Edit tank, assign template, Add tank. On selected dive only */
    public tankChanged$: Observable<void>;
    /** Triggers depth change. On selected dive only. */
    public tankRemoved$: Observable<Tank>;
    /**
     * Edit depths, duration, assign tank, remove dive.
     * On selected dive only.
     **/
    public depthChanged$: Observable<void>;
    /** When load default. On selected dive only */
    public optionsReloaded$: Observable<OptionsService>;
    /** When editing options. On selected dive only */
    public optionsChanged$: Observable<void>;
    /** Only in case Reload all dives, add dive or load default. */
    public depthsReloaded$: Observable<DepthsService>;
    /** For any finished dive */
    public infoCalculated$: Observable<number | undefined>;
    /** For selected dive only. */
    public wayPointsCalculated$: Observable<number | undefined>;
    public selectedChanged$: Observable<void>;
    /** This need special event, since all dives are reset and we really need to recalculate all */
    public setToSimple$: Observable<void>;

    private onTanksReloaded = new Subject<TanksService>();
    private onTankChanged = new Subject<void>();
    private onTankRemoved = new Subject<Tank>();
    private onDepthsReloaded = new Subject<DepthsService>();
    private onDepthChanged = new Subject<void>();
    private onOptionsReloaded = new Subject<OptionsService>();
    private onOptionsChanged = new Subject<void>();
    private onSelectedChanged = new Subject<void>();
    private onInfoCalculated = new Subject<number | undefined>();
    private onWayPointsCalculated = new Subject<number | undefined>();
    private onSetToSimple = new Subject<void>();

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
        this.setToSimple$ = this.onSetToSimple.asObservable();
    }

    public sendTanksReloaded(source: TanksService): void {
        Logger.debug('Tanks reloaded');
        this.onTanksReloaded.next(source);
    }

    public sendTanksRemoved(removed: Tank): void {
        Logger.debug('Tank removed');
        this.onTankRemoved.next(removed);
    }

    public sendTankChanged(){
        Logger.debug('Tank changed');
        this.onTankChanged.next();
    }

    public sendDepthChanged(): void {
        Logger.debug('Depth changed');
        this.onDepthChanged.next();
    }

    public sendOptionsReloaded(source: OptionsService): void {
        Logger.debug('Options reloaded');
        this.onOptionsReloaded.next(source);
    }

    public sendOptionsChanged(): void {
        Logger.debug('Options changed');
        this.onOptionsChanged.next();
    }

    public sendSelectedChanged(newSelectedId: number): void {
        Logger.debug(`Selected dive changed to ${newSelectedId}`);
        this.onSelectedChanged.next();
    }

    public sendDepthsReloaded(source: DepthsService): void {
        Logger.debug('Depths reloaded');
        this.onDepthsReloaded.next(source);
    }

    public sendWayPointsCalculated(diveId?: number): void {
        this.onWayPointsCalculated.next(diveId);
    }

    public sendInfoCalculated(diveId?: number): void {
        this.onInfoCalculated.next(diveId);
    }

    public sendSetSimple(): void {
        this.onSetToSimple.next();
    }
}
