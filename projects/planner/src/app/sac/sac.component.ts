import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

import { SacCalculatorService } from '../shared/sac-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { Diver } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';


@Component({
    selector: 'app-sac',
    templateUrl: './sac.component.html',
    styleUrls: ['./sac.component.scss']
})
export class SacComponent implements OnInit {
    public calcIcon = faCalculator;
    public formSac!: UntypedFormGroup;
    private durationControl!: FormControl;
    private rmvControl!: FormControl;
    private usedControl!: FormControl;

    constructor(
        private inputs: InputControls,
        private formBuilder: UntypedFormBuilder,
        private router: Router, private planer: PlannerService,
        public calc: SacCalculatorService, public units: UnitConversion) {
    }

    public get gasSac(): number {
        const sac = Diver.gasSac(this.calc.rmv, this.calc.tank);
        return this.units.fromBar(sac);
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get depthInvalid(): boolean {
        const depth = this.formSac.controls.depth;
        return this.inputs.controlInValid(depth);
    }

    public get tankInvalid(): boolean {
        const tankSize = this.formSac.controls.tankSize;
        return this.inputs.controlInValid(tankSize);
    }

    public get usedInvalid(): boolean {
        const used = this.formSac.controls.used;
        return this.inputs.controlInValid(used);
    }

    public get rmvInvalid(): boolean {
        const rmv =  this.formSac.controls.rmv;
        return this.inputs.controlInValid(rmv);
    }

    public get durationInvalid(): boolean {
        const duration = this.formSac.controls.duration;
        return this.inputs.controlInValid(duration);
    }

    public get calcDepth(): number {
        return this.units.fromMeters(this.calc.depth);
    }

    public get calcTank(): number {
        return this.units.fromTankLiters(this.calc.tank);
    }

    public get calcUsed(): string | null {
        const used = this.units.fromBar(this.calc.used);
        return this.inputs.formatNumber(used);
    }

    public get calcRmv(): string | null {
        const rmv = this.units.fromLiter(this.calc.rmv);
        return this.inputs.formatNumber(rmv, 2);
    }

    public get calcDuration(): string | null {
        const duration = this.calc.duration;
        return this.inputs.formatNumber(duration);
    }

    private get dataModel(): any {
        return {
            depth: this.inputs.formatNumber(this.calcDepth),
            tankSize: this.inputs.formatNumber(this.calcTank),
            used: this.calcUsed,
            duration: this.calcDuration,
            rmv: this.calcRmv,
        };
    }

    public ngOnInit(): void {
        this.durationControl = this.formBuilder.control(this.calcDuration,
            [Validators.required, Validators.min(this.ranges.duration[0]), Validators.max(this.ranges.duration[1])]);
        this.usedControl = this.formBuilder.control(this.calcUsed,
            [Validators.required, Validators.min(this.ranges.tankPressure[0]), Validators.max(this.ranges.tankPressure[1])]);
        this.rmvControl = this.formBuilder.control(this.calcRmv,
            [Validators.required, Validators.min(this.ranges.diverRmv[0]), Validators.max(this.ranges.diverRmv[1])]);

        this.formSac = this.formBuilder.group({
            depth: [this.inputs.formatNumber(this.calcDepth),
                [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])]],
            tankSize: [this.inputs.formatNumber(this.calcTank),
                [Validators.required, Validators.min(this.ranges.tankSize[0]), Validators.max(this.ranges.tankSize[1])]]
        });

        this.toSac();
    }

    public inputChanged(): void {
        if (this.formSac.invalid) {
            return;
        }

        const values = this.formSac.value;
        this.calc.depth = this.units.toMeters(Number(values.depth));
        this.calc.tank = this.units.toTankLiters(Number(values.tankSize));
        this.calc.used = this.units.toBar(Number(values.used));
        this.calc.rmv = this.units.toLiter(Number(values.rmv));
        this.calc.duration = Number(values.duration);

        this.reload();
    }

    public toDuration(): void {
        this.calc.toDuration();
        this.enableAll();
        this.formSac.removeControl('duration');
    }

    public toUsed(): void {
        this.calc.toUsed();
        this.enableAll();
        this.formSac.removeControl('used');
    }

    public toSac(): void {
        this.calc.toSac();
        this.enableAll();
        this.formSac.removeControl('rmv');
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        if (this.formSac.invalid) {
            return;
        }

        this.planer.diver.rmv = this.calc.rmv;
    }

    private enableAll(): void {
        this.formSac.addControl('used', this.usedControl);
        this.formSac.addControl('duration', this.durationControl);
        this.formSac.addControl('rmv', this.rmvControl);
        this.reload();
    }

    private reload(): void {
        this.formSac.patchValue(this.dataModel);
    }
}
