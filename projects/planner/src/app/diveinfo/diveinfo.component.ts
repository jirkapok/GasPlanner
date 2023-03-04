import { Component } from '@angular/core';
import { ClipboardService, IClipboardResponse } from 'ngx-clipboard';
import {
    faSlidersH, faShareFromSquare
} from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { Dive } from '../shared/models';
import { Tank } from 'scuba-physics';
import { UnitConversion } from '../shared/UnitConversion';
import { GasToxicity } from '../shared/gasToxicity.service';
import { takeUntil } from 'rxjs';
import { Streamed } from '../shared/streamed';
import { DepthsService } from '../shared/depths.service';
import { TanksService } from '../shared/tanks.service';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { Plan } from '../shared/plan.service';

@Component({
    selector: 'app-consumption',
    templateUrl: './diveinfo.component.html',
    styleUrls: ['./diveinfo.component.scss']
})
export class DiveInfoComponent extends Streamed {
    public toxicity: GasToxicity;
    public dive: Dive;
    public icon = faSlidersH;
    public iconShare = faShareFromSquare;
    public toastVisible = false;

    constructor(private clipboard: ClipboardService,
        private depthsService: DepthsService,
        private tanksService: TanksService,
        public planner: PlannerService,
        private viewSwitch: ViewSwitchService,
        public units: UnitConversion,
        private plan: Plan) {
        super();
        this.dive = this.planner.dive;
        this.toxicity = new GasToxicity(this.planner.options);

        this.clipboard.copyResponse$.pipe(takeUntil(this.unsubscribe$))
            .subscribe((res: IClipboardResponse) => {
                // stupid replacement of Bootstrap toasts, because not part of the free mdb package
                if (res.isSuccess) {
                    this.toastVisible = true;
                    setTimeout(() => {
                        this.hideToast();
                    }, 5000);
                }
            });
    }

    public get tanks(): Tank[] {
        return this.tanksService.tankData;
    }

    public get showTankId(): boolean {
        return this.viewSwitch.isComplex;
    }

    public get showMaxBottomTime(): boolean {
        return this.dive.maxTime > 0;
    }

    public get needsReturn(): boolean {
        return this.plan.needsReturn;
    }

    public get noDeco(): number {
        return this.plan.noDecoTime;
    }

    public get showApply(): boolean {
        return !this.viewSwitch.isComplex;
    }

    public get averageDepth(): number {
        return this.units.fromMeters(this.dive.averageDepth);
    }

    public applyMaxDuration(): void {
        this.depthsService.applyMaxDuration();
    }

    public applyNdlDuration(): void {
        this.depthsService.applyNdlDuration();
    }

    public sharePlan(): void {
        this.clipboard.copy(window.location.href);
    }

    public hideToast(): void {
        this.toastVisible = false;
    }
}
