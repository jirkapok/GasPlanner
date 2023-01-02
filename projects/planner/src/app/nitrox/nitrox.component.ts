import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import {
    FormControl, UntypedFormBuilder, UntypedFormGroup
} from '@angular/forms';

import { NitroxCalculatorService } from '../shared/nitrox-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { InputControls } from '../shared/inputcontrols';
import { NitroxValidators } from '../shared/NitroxValidators';
import { TextConstants } from '../shared/TextConstants';
import { ValidatorGroups } from '../shared/ValidatorGroups';

@Component({
    selector: 'app-nitrox',
    templateUrl: './nitrox.component.html',
    styleUrls: ['./nitrox.component.scss']
})
export class NitroxComponent implements OnInit {
    public calcIcon = faCalculator;
    public nitroxForm!: UntypedFormGroup;
    public depthConverterWarning = TextConstants.depthConverterWarning;
    private fO2Control!: FormControl;
    private pO2Control!: FormControl;
    private modControl!: FormControl;
    private failingMod = false;

    constructor(
        private fb: UntypedFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
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
        if (this.failingMod) {
            return 0;
        }

        return this.units.fromMeters(this.calc.mod);
    }

    private get dataModel(): any {
        return {
            fO2: this.inputs.formatNumber(this.calc.fO2),
            pO2: this.inputs.formatNumber(this.calc.pO2, 2),
            mod: this.inputs.formatNumber(this.calcMod)
        };
    }

    public ngOnInit(): void {
        this.fO2Control = this.fb.control(this.inputs.formatNumber(this.calc.fO2), this.validators.oxygen);
        this.pO2Control = this.fb.control(this.inputs.formatNumber(this.calc.pO2), this.validators.ppO2);
        this.modControl = this.fb.control(this.inputs.formatNumber(this.calcMod), this.validators.depth);
        this.nitroxForm = this.fb.group({}, { validator: NitroxValidators.lowMod(() => this.failingMod), });
        this.toMod();
    }

    public inputChanged(): void {
        try {
            this.failingMod = false;
            this.nitroxForm.updateValueAndValidity();

            if (this.nitroxForm.invalid) {
                return;
            }

            const values = this.nitroxForm.value;
            this.calc.pO2 = Number(values.pO2);
            this.calc.fO2 = Number(values.fO2);
            const newMod = Number(values.mod);
            this.calc.mod = this.units.toMeters(newMod);

            this.reload();
        } catch (e) {
            this.failingMod = true;
            this.nitroxForm.updateValueAndValidity();
        }
    }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }

    public use(): void {
        if (this.nitroxForm.invalid) {
            return;
        }

        this.planer.firstTank.o2 = this.calc.fO2;
        this.planer.diver.maxPpO2 = this.calc.pO2;
    }

    public toMod(): void {
        this.calc.toMod();
        this.enableAll();
        this.nitroxForm.removeControl('mod');
    }

    public toBestMix(): void {
        this.calc.toBestMix();
        this.enableAll();
        this.nitroxForm.removeControl('fO2');
    }

    public toPO2(): void {
        this.calc.toPO2();
        this.enableAll();
        this.nitroxForm.removeControl('pO2');
    }

    private enableAll(): void {
        this.nitroxForm.addControl('mod', this.modControl);
        this.nitroxForm.addControl('fO2', this.fO2Control);
        this.nitroxForm.addControl('pO2', this.pO2Control);
        this.reload();
    }

    private reload(): void {
        this.nitroxForm.patchValue(this.dataModel);
    }
}
