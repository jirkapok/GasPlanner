import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { OptionsService } from './options.service';
import { TanksService } from './tanks.service';
import {DepthsService} from './depths.service';

@Injectable()
export class ViewSwitchService {
    /** when switching between simple and complex view */
    public viewSwitched: Observable<void>;
    private _isComplex = false;
    private onViewSwitched = new Subject<void>();

    constructor(
        // TODO needs to be replaced for all schedules
        private depths: DepthsService,
        private options: OptionsService,
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
        this.depths.setSimple();
    }
}
