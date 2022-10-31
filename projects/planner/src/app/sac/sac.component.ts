import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

import { SacCalculatorService } from '../shared/sac-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { Diver } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';


@Component({
    selector: 'app-sac',
    templateUrl: './sac.component.html',
    styleUrls: ['./sac.component.css']
})
export class SacComponent implements OnInit {
    public calcIcon = faCalculator;
    public formSac!: FormGroup;

    constructor(
        private numberPipe: DecimalPipe,
        private formBuilder: FormBuilder,
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
        return InputControls.controlInValid(depth);
    }

    public get tankInvalid(): boolean {
        const tankSize = this.formSac.controls.tankSize;
        return InputControls.controlInValid(tankSize);
    }

    public get usedInvalid(): boolean {
        const used = this.formSac.controls.used;
        return InputControls.controlInValid(used);
    }

    public get rmvInvalid(): boolean {
        const rmv = this.formSac.controls.rmv;
        return InputControls.controlInValid(rmv);
    }

    public get durationInvalid(): boolean {
        const duration = this.formSac.controls.duration;
        return InputControls.controlInValid(duration);
    }

    public get calcDepth(): number {
        return this.units.fromMeters(this.calc.depth);
    }

    public get calcTank(): number {
        return this.units.fromTankLiters(this.calc.tank);
    }

    public get calcUsed(): number {
        return this.units.fromBar(this.calc.used);
    }

    public get calcRmv(): number {
        return this.units.fromLiter(this.calc.rmv);
    }

    public get calcDuration(): number {
        return this.calc.duration;
    }

    private get dataModel(): any {
        return {
            depth: InputControls.formatNumber(this.numberPipe, this.calcDepth),
            duration: InputControls.formatNumber(this.numberPipe, this.calc.duration),
            tankSize: InputControls.formatNumber(this.numberPipe, this.calcTank),
            used: InputControls.formatNumber(this.numberPipe, this.calcUsed),
            rmv:  InputControls.formatNumber(this.numberPipe, this.calcRmv),
        };
    }

    public ngOnInit(): void {
        this.formSac = this.formBuilder.group({
            depth: [InputControls.formatNumber(this.numberPipe, this.calcDepth),
                [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])]],
            duration: [InputControls.formatNumber(this.numberPipe, this.calcDuration),
                [Validators.required, Validators.min(this.ranges.duration[0]), Validators.max(this.ranges.duration[1])]],
            tankSize: [InputControls.formatNumber(this.numberPipe, this.calcTank),
                [Validators.required, Validators.min(this.ranges.tankSize[0]), Validators.max(this.ranges.tankSize[1])]],
            used: [InputControls.formatNumber(this.numberPipe, this.calcUsed),
                [Validators.required, Validators.min(this.ranges.tankPressure[0]), Validators.max(this.ranges.tankPressure[1])]],
            rmv:  [InputControls.formatNumber(this.numberPipe, this.calcRmv),
                [Validators.required, Validators.min(this.ranges.diverRmv[0]), Validators.max(this.ranges.diverRmv[1])]],
        });
    }

    public inputChanged(): void {
        if(this.formSac.invalid) {
            return;
        }

        const values = this.formSac.value;
        this.calc.depth = this.units.toMeters(values.depth);
        this.calc.tank = this.units.toTankLiters(values.tankSize);
        this.calc.used = this.units.toBar(values.used);
        this.calc.rmv = this.units.toLiter(values.rmv);
        this.calc.duration = values.duration;

        this.formSac.patchValue(this.dataModel);
    }

    public async goBack(): Promise<boolean>  {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        this.planer.diver.rmv = this.calc.rmv;
    }
}
