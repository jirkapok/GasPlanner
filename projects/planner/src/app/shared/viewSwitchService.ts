import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { OptionsDispatcherService } from './options-dispatcher.service';
import { Plan } from './plan.service';
import { TanksService } from './tanks.service';

@Injectable()
export class ViewSwitchService {
    /** when switching between simple and complex view */
    public viewSwitched: Observable<void>;
    private _isComplex = false;
    private onViewSwitched = new Subject<void>();

    constructor(
        private plan: Plan,
        private options: OptionsDispatcherService,
        private tanks: TanksService) {
        this.viewSwitched = this.onViewSwitched.asObservable();
    }

    public get isComplex(): boolean {
        return this._isComplex;
    }

    public set isComplex(newValue: boolean) {
        // not preventing repetitive updates, because it would block settings reload
        this._isComplex = newValue;
        if (!newValue) {
            this.resetToSimple();
        }

        this.onViewSwitched.next();
    }

    /* reset only gas and depths to values valid for simple view. */
    private resetToSimple(): void {
        this.options.resetToSimple();
        this.tanks.resetToSimple();
        const firstTank = this.tanks.firstTank.tank;
        const options = this.options.getOptions();
        this.plan.setSimple(this.plan.maxDepth, this.plan.duration, firstTank, options);
    }
}
