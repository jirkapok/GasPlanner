import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { faPercent } from '@fortawesome/free-solid-svg-icons';
import { FormControl, NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { Precision } from 'scuba-physics';
import { NitroxCalculatorService } from '../../shared/nitrox-calculator.service';
import { RangeConstants, UnitConversion } from '../../shared/UnitConversion';
import { InputControls } from '../../shared/inputcontrols';
import { NitroxValidators } from '../../shared/NitroxValidators';
import { TextConstants } from '../../shared/TextConstants';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { SubViewStorage } from '../../shared/subViewStorage';
import { NitroxViewState } from '../../shared/views.model';
import { KnownViews } from '../../shared/viewStates';
import { DiveSchedules } from '../../shared/dive.schedules';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';

interface NitroxForm {
    mod?: FormControl<number>;
    fO2?: FormControl<number>;
    pO2?: FormControl<number>;
    depth?: FormControl<number>;
}

@Component({
    selector: 'app-nitrox',
    templateUrl: './nitrox.component.html',
    styleUrls: ['./nitrox.component.scss'],
    standalone: false
})
export class NitroxComponent implements OnInit {
    public calcIcon = faPercent;
    public nitroxForm!: FormGroup<NitroxForm>;
    public depthConverterWarning = TextConstants.depthConverterWarning;
    private fO2Control!: FormControl<number>;
    private pO2Control!: FormControl<number>;
    private modControl!: FormControl<number>;
    private depthControl!: FormControl<number>;
    private failingMod = false;

    constructor(
        public calc: NitroxCalculatorService,
        public units: UnitConversion,
        public location: Location,
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        private schedules: DiveSchedules,
        private viewStates: SubViewStorage,
        private modalService: MdbModalService
    ) {
        this.loadState();
        this.saveState();
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get pO2Invalid(): boolean {
        const pO2 = this.nitroxForm.controls.pO2;
        return this.inputs.controlInValid(pO2);
    }

    public get modInvalid(): boolean {
        const mod = this.nitroxForm.controls.mod;
        return this.inputs.controlInValid(mod);
    }

    public get depthInvalid(): boolean {
        const depth = this.nitroxForm.controls.depth;
        return this.inputs.controlInValid(depth);
    }

    public get calcMod(): number {
        if (this.failingMod) {
            return 0;
        }

        return this.units.fromMeters(this.calc.mod);
    }

    public get ead(): number {
        const ead = this.calc.ead;
        return this.units.fromMeters(ead);
    }

    public get calcDepth(): number {
        return this.units.fromMeters(this.calc.depth);
    }

    public get eadAtDepth(): number {
        return this.units.fromMeters(this.calc.eadAtDepth);
    }

    public ngOnInit(): void {
        this.fO2Control = this.fb.control(Precision.round(this.calc.fO2, 1), this.validators.nitroxOxygen);
        this.pO2Control = this.fb.control(Precision.round(this.calc.pO2, 2), this.validators.ppO2);
        this.modControl = this.fb.control(Precision.round(this.calcMod, 1), this.validators.depth);
        this.depthControl = this.fb.control(Precision.round(this.calcDepth, 1), this.validators.depth);
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

            this.updateCalc();
            this.reload();
            this.saveState();
        } catch (e) {
            this.failingMod = true;
            this.nitroxForm.updateValueAndValidity();
        }
    }

    public use(): void {
        if (this.nitroxForm.invalid) {
            return;
        }

        const selected = this.schedules.selected;
        selected.applyNitrox(this.calc.fO2, this.calc.pO2);
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

    public toEad(): void {
        this.calc.toEad();
        this.enableAll();
        this.nitroxForm.removeControl('pO2');
        this.nitroxForm.removeControl('mod');
        this.nitroxForm.addControl('depth', this.depthControl);
    }

    private enableAll(): void {
        this.nitroxForm.addControl('mod', this.modControl);
        this.nitroxForm.addControl('fO2', this.fO2Control);
        this.nitroxForm.addControl('pO2', this.pO2Control);
        this.nitroxForm.removeControl('depth');
        this.reload();
    }

    private reload(): void {
        this.nitroxForm.patchValue({
            fO2: Precision.round(this.calc.fO2, 1),
            pO2: Precision.round(this.calc.pO2, 2),
            mod: Precision.round(this.calcMod, 1),
            depth: Precision.round(this.calcDepth, 1)
        });
    }

    private loadState(): void {
        let state: NitroxViewState = this.viewStates.loadView(
            KnownViews.nitrox
        );

        if (!state) {
            state = this.createState();
        }

        this.calc.fO2 = state.fO2;
        this.calc.pO2 = state.pO2;
    }

    private saveState(): void {
        const viewState = this.createState(this.calc.fO2, this.calc.pO2);
        this.viewStates.saveView(viewState);
    }

    private createState(fO2 = 21, pO2 = 1.4): NitroxViewState {
        return {
            fO2: fO2,
            pO2: pO2,
            id: KnownViews.nitrox
        };
    }

    private updateCalc(): void {
        const values = this.nitroxForm.value;
        this.calc.fO2 = Number(values.fO2);

        if(this.calc.inEad) {
            const newDepth = Number(values.depth);
            this.calc.depth = this.units.toMeters(newDepth);
        } else {
            this.calc.pO2 = Number(values.pO2);
            const newMod = Number(values.mod);
            this.calc.mod = this.units.toMeters(newMod);
        }
    }
}
