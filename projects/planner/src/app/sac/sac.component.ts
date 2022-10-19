import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

import { SacCalculatorService } from '../shared/sac-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { Diver } from 'scuba-physics';


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
        return this.controlInValid(depth);
    }

    public get tankInvalid(): boolean {
        const tankSize = this.formSac.controls.tankSize;
        return this.controlInValid(tankSize);
    }

    public get usedInvalid(): boolean {
        const used = this.formSac.controls.used;
        return this.controlInValid(used);
    }

    public get rmvInvalid(): boolean {
        const rmv = this.formSac.controls.rmv;
        return this.controlInValid(rmv);
    }

    public get durationInvalid(): boolean {
        const duration = this.formSac.controls.duration;
        return this.controlInValid(duration);
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
            depth: this.formatNumber(this.calcDepth),
            duration: this.formatNumber(this.calc.duration),
            tankSize: this.formatNumber(this.calcTank),
            used: this.formatNumber(this.calcUsed),
            rmv:  this.formatNumber(this.calcRmv),
        };
    }

    public ngOnInit(): void {
        this.formSac = this.formBuilder.group({
            depth: [this.formatNumber(this.calcDepth),
                [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])]],
            duration: [this.formatNumber(this.calcDuration),
                [Validators.required, Validators.min(this.ranges.duration[0]), Validators.max(this.ranges.duration[1])]],
            tankSize: [this.formatNumber(this.calcTank),
                [Validators.required, Validators.min(this.ranges.tankSize[0]), Validators.max(this.ranges.tankSize[1])]],
            used: [this.formatNumber(this.calcUsed),
                [Validators.required, Validators.min(this.ranges.tankPressure[0]), Validators.max(this.ranges.tankPressure[1])]],
            rmv:  [this.formatNumber(this.calcRmv),
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

    public controlInValid(control: AbstractControl): boolean {
        return control.invalid && (control.dirty || control.touched);
    }

    private formatNumber(value: number): string | null {
        return this.numberPipe.transform(value, '1.0-1');
    }
}
