import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { NitroxCalculatorService } from '../shared/nitrox-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { InputControls } from '../shared/inputcontrols';

@Component({
    selector: 'app-nitrox',
    templateUrl: './nitrox.component.html',
    styleUrls: ['./nitrox.component.scss']
})
export class NitroxComponent implements OnInit {
    public calcIcon = faCalculator;
    public nitroxForm!: UntypedFormGroup;

    constructor(
        private fb: UntypedFormBuilder,
        private inputs: InputControls,
        public calc: NitroxCalculatorService,
        private router: Router,
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

    public get pO2Invalid(): boolean {
        const pO2 = this.nitroxForm.controls.pO2;
        return this.inputs.controlInValid(pO2);
    }

    public get modInvalid(): boolean {
        const mod = this.nitroxForm.controls.mod;
        return this.inputs.controlInValid(mod);
    }

    public get fO2Invalid(): boolean {
        const fO2 = this.nitroxForm.controls.fO2;
        return this.inputs.controlInValid(fO2);
    }

    public get calcMod(): number {
        return this.units.fromMeters(this.calc.mod);
    }

    private get dataModel(): any {
        return {
            fO2: this.inputs.formatNumber(this.calc.fO2),
            pO2: this.inputs.formatNumber(this.calc.pO2),
            mod: this.inputs.formatNumber(this.calcMod)
        };
    }

    public ngOnInit(): void {
        this.nitroxForm = this.fb.group({
            fO2: [this.inputs.formatNumber(this.calc.fO2),
                [Validators.required, Validators.min(this.ranges.nitroxOxygen[0]), Validators.max(this.ranges.nitroxOxygen[1])]],
            pO2: [this.inputs.formatNumber(this.calc.pO2),
                [Validators.required, Validators.min(this.ranges.ppO2[0]), Validators.max(this.ranges.ppO2[1])]],
            mod: [this.inputs.formatNumber(this.calcMod),
                [Validators.required, Validators.min(this.ranges.depth[0]), Validators.max(this.ranges.depth[1])]],
        });
    }

    public inputChanged(): void {
        if(this.nitroxForm.invalid) {
            return;
        }

        const values = this.nitroxForm.value;
        this.calc.pO2 = Number(values.pO2);
        this.calc.fO2 = Number(values.fO2);
        const newMod = Number(values.mod);
        this.calc.mod = this.units.toMeters(newMod);

        this.nitroxForm.patchValue(this.dataModel);
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        this.planer.firstTank.o2 = this.calc.fO2;
        this.planer.diver.maxPpO2 = this.calc.pO2;
    }
}
