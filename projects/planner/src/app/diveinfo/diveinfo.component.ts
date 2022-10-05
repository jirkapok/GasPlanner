import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ClipboardService, IClipboardResponse } from 'ngx-clipboard';
import { Toast } from 'bootstrap';
import {
    faSlidersH, faShareFromSquare
} from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { Dive } from '../shared/models';
import { Tank, OtuCalculator } from 'scuba-physics';
import { UnitConversion } from '../shared/UnitConversion';
import { GasToxicity } from '../shared/gasToxicity.service';

@Component({
    selector: 'app-consumption',
    templateUrl: './diveinfo.component.html',
    styleUrls: ['./diveinfo.component.css']
})
export class DiveInfoComponent implements OnInit {
    @ViewChild('toastElement', { static: true })
    public toastEl!: ElementRef;
    public toxicity: GasToxicity;
    public dive: Dive;
    public icon = faSlidersH;
    public iconShare = faShareFromSquare;
    private toast!: Toast;

    constructor(private clipboard: ClipboardService, public planner: PlannerService, public units: UnitConversion) {
        this.dive = this.planner.dive;
        this.toxicity = new GasToxicity(this.planner.options);

        this.clipboard.copyResponse$.subscribe((res: IClipboardResponse) => {
            if (res.isSuccess) {
                this.toast.show();
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

    public ngOnInit(): void {
        this.toast = new Toast(this.toastEl.nativeElement, { delay: 5000, });
    }

    public sharePlan(): void {
        this.clipboard.copy(window.location.href);
    }

    public hideToast(): void {
        this.toast.hide();
    }
}
