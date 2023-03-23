import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import {
    FormControl, NonNullableFormBuilder, FormGroup
} from '@angular/forms';

import { NitroxCalculatorService } from '../shared/nitrox-calculator.service';
import { PlannerService } from '../shared/planner.service';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { InputControls } from '../shared/inputcontrols';
import { NitroxValidators } from '../shared/NitroxValidators';
import { TextConstants } from '../shared/TextConstants';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { TankBound } from '../shared/models';
import { Precision, Tank } from 'scuba-physics';
import { TanksService } from '../shared/tanks.service';


interface NitroxForm {
    mod?: FormControl<number>;
    fO2?: FormControl<number>;
    pO2?: FormControl<number>;
}

@Component({
    selector: 'app-nitrox',
    templateUrl: './nitrox.component.html',
    styleUrls: ['./nitrox.component.scss']
})
export class NitroxComponent implements OnInit {
    public calcIcon = faCalculator;
    public nitroxForm!: FormGroup<NitroxForm>;
    public depthConverterWarning = TextConstants.depthConverterWarning;
    public tank: TankBound;
    private fO2Control!: FormControl<number>;
    private pO2Control!: FormControl<number>;
    private modControl!: FormControl<number>;
    private failingMod = false;

    constructor(
        public calc: NitroxCalculatorService,
        public units: UnitConversion,
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        private router: Router,
        private planer: PlannerService,
        private tanksService: TanksService) {
        this.calc.fO2 = this.tanksService.firstTank.tank.o2;
        this.calc.pO2 = this.planer.diver.maxPpO2;
        this.tank = new TankBound(new Tank(15, 200, 21), this.units);
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

    public ngOnInit(): void {
        this.fO2Control = this.fb.control(Precision.round(this.calc.fO2, 1), this.validators.nitroxOxygen);
        this.pO2Control = this.fb.control(Precision.round(this.calc.pO2, 2), this.validators.ppO2);
        this.modControl = this.fb.control(Precision.round(this.calcMod, 1), this.validators.depth);
        this.nitroxForm = this.fb.group({}, {
            validators: NitroxValidators.lowMod(() => this.failingMod),
        });
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

        this.tanksService.firstTank.tank.o2 = this.calc.fO2;
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
        this.nitroxForm.patchValue({
            fO2: Precision.round(this.calc.fO2, 1),
            pO2: Precision.round(this.calc.pO2, 2),
            mod: Precision.round(this.calcMod, 1)
        });
    }
}
