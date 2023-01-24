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

    constructor(private clipboard: ClipboardService, private depthsService: DepthsService,
        public planner: PlannerService, public units: UnitConversion) {
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
        return this.planner.tanks;
    }

    public get showTankId(): boolean {
        return this.planner.isComplex;
    }

    public get showMaxBottomTime(): boolean {
        return this.dive.maxTime > 0;
    }

    public get needsReturn(): boolean {
        return this.planner.plan.needsReturn;
    }

    public get noDeco(): number {
        return this.planner.plan.noDecoTime;
    }

    public get showApply(): boolean {
        return !this.planner.isComplex;
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
