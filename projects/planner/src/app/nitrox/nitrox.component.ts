import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NitroxCalculatorService } from '../shared/nitrox-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-nitrox',
    templateUrl: './nitrox.component.html',
    styleUrls: ['./nitrox.component.css']
})
export class NitroxComponent implements OnInit {
    public calcIcon = faCalculator;
    public nitroxForm!: FormGroup;

    constructor(
        private fb: FormBuilder, private router: Router,
        private numberPipe: DecimalPipe,
        public calc: NitroxCalculatorService,
        private planer: PlannerService, public units: UnitConversion) {
        this.calc.fO2 = this.planer.firstTank.o2;
        this.calc.pO2 = this.planer.diver.maxPpO2;
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get ead(): number {
        const ead = this.calc.ead;
        return this.units.fromMeters(ead);
    }

    public get calcMod(): number {
        return this.units.fromMeters(this.calc.mod);
    }

    public get pO2Invalid(): boolean {
        const pO2 = this.nitroxForm.controls.pO2;
        return this.controlInValid(pO2);
    }

    public get modInvalid(): boolean {
        const mod = this.nitroxForm.controls.mod;
        return this.controlInValid(mod);
    }

    public get fO2Invalid(): boolean {
        const fO2 = this.nitroxForm.controls.fO2;
        return this.controlInValid(fO2);
    }

    private get dataModel(): any {
        return {
            fO2: this.formatNumber(this.calc.fO2),
            pO2: this.formatNumber(this.calc.pO2),
            mod: this.formatNumber(this.calc.mod)
        };
    }

    public set calcMod(newValue: number) {
        this.calc.mod = this.units.toMeters(newValue);
    }

    public ngOnInit(): void {
        this.nitroxForm = this.fb.group({
            fO2: [this.formatNumber(this.calc.fO2),
                [Validators.required, Validators.min(this.ranges.nitroxOxygen[0]), Validators.max(this.ranges.nitroxOxygen[1])]],
            pO2: [this.formatNumber(this.calc.pO2),
                [Validators.required, Validators.min(this.ranges.ppO2[0]), Validators.max(this.ranges.ppO2[1])]],
            mod: [this.formatNumber(this.calc.mod),
                [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])]],
        });
    }

    public inputChanged(): void {
        if(this.nitroxForm.invalid) {
            return;
        }

        const values = this.nitroxForm.value;
        this.calc.pO2 = values.pO2;
        this.calc.fO2 = values.fO2;
        this.calc.mod = values.mod;

        this.nitroxForm.patchValue(this.dataModel);
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        this.planer.firstTank.o2 = this.calc.fO2;
        this.planer.diver.maxPpO2 = this.calc.pO2;
    }

    public controlInValid(control: AbstractControl): boolean {
        return control.invalid && (control.dirty || control.touched);
    }

    private formatNumber(value: number): string | null {
        return this.numberPipe.transform(value, '1.0-1');
    }
}
