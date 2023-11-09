import {Observable, Subject} from 'rxjs';
import {Tank} from 'scuba-physics';

/**
 * Since we show only the selected dive schedule, we are always reloading properties of selected dive.
 */
export class ReloadDispatcher {
    /** Event fired only in case of tanks rebuild (loadFrom or resetToSimple).
     *  Not fired when adding or removing tanks.
     **/
    public tanksReloaded$: Observable<void>;
    public tankRemoved$: Observable<Tank>;
    // TODO add Plan.reloaded
    // TODO add DepthsService.reloaded?

    private onTanksReloaded = new Subject<void>();
    private onTankRemoved = new Subject<Tank>();

    public sendTanksReloaded(): void {
        this.onTanksReloaded.next();
    }

    public sendTanksRemoved(removed: Tank): void {
        this.onTankRemoved.next(removed);
    }
}
