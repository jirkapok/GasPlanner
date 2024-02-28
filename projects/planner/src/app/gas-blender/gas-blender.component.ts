import { Component, OnInit } from '@angular/core';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { GasBlenderService } from '../shared/gas-blender.service';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';

interface IGasBlenderForm {
    sourceO2: FormControl<number>;
    sourceHe: FormControl<number>;
    sourcePressure: FormControl<number>;
    topMixO2: FormControl<number>;
    topMixHe: FormControl<number>;
    targetO2: FormControl<number>;
    targetHe: FormControl<number>;
    targetPressure: FormControl<number>;
}

@Component({
    selector: 'app-gas-blender',
    templateUrl: './gas-blender.component.html',
    styleUrls: ['./gas-blender.component.scss']
})
export class GasBlenderComponent implements OnInit {
    public readonly calcIcon = faCalculator;
    public blenderForm!: FormGroup<IGasBlenderForm>;

    constructor(
        public units: UnitConversion,
        public blender: GasBlenderService,
        private validators: ValidatorGroups,
        private inputs: InputControls,
        private fb: NonNullableFormBuilder) {
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get addO2(): number {
        return this.blender.addO2;
    }

    public get addHe(): number {
        return this.blender.addHe;
    }

    public get addTopMix(): number {
        return this.blender.addTop;
    }

    public get removeFromSource(): number {
        return this.blender.removeFromSource;
    }

    public get needsRemove(): boolean {
        return this.blender.needsRemove;
    }

    public get sourceHeInvalid(): boolean {
        const control = this.blenderForm.controls.sourceHe;
        return this.inputs.controlInValid(control);
    }

    public get topMixHeInvalid(): boolean {
        const control = this.blenderForm.controls.topMixHe;
        return this.inputs.controlInValid(control);
    }

    public get targetHeInvalid(): boolean {
        const control = this.blenderForm.controls.targetHe;
        return this.inputs.controlInValid(control);
    }

    // we dont need working pressure for source and target,
    // since dont count with volume only percentage
    public get sourcePressureInvalid(): boolean {
        const control = this.blenderForm.controls.sourcePressure;
        return this.inputs.controlInValid(control);
    }

    public get targetPressureInvalid(): boolean {
        const control = this.blenderForm.controls.targetPressure;
        return this.inputs.controlInValid(control);
    }

    public ngOnInit(): void {
        // custom range to allow mix to empty tank
        const pressureRange: [number, number] = [0, this.ranges.tankPressure[1]];
        const pressureValidator = this.validators.rangeFor(pressureRange);
        this.blenderForm = this.fb.group({
            sourceO2: [this.blender.sourceTank.o2, this.validators.rangeFor(this.ranges.trimixOxygen)],
            sourceHe: [this.blender.sourceTank.he, this.validators.rangeFor(this.ranges.tankHe)],
            sourcePressure: [this.blender.sourceTank.startPressure, pressureValidator],
            topMixO2: [this.blender.topMix.o2, this.validators.rangeFor(this.ranges.trimixOxygen)],
            topMixHe: [this.blender.topMix.he, this.validators.rangeFor(this.ranges.tankHe)],
            targetO2: [this.blender.targetTank.o2, this.validators.rangeFor(this.ranges.trimixOxygen)],
            targetHe: [this.blender.targetTank.he, this.validators.rangeFor(this.ranges.tankHe)],
            targetPressure: [this.blender.targetTank.startPressure, pressureValidator]
        });
    }

    public applyChange(): void {
        if(this.blenderForm.invalid) {
            return;
        }

        const newValue = this.blenderForm.value;
        this.blender.sourceTank.o2 = Number(newValue.sourceO2);
        this.blender.sourceTank.he = Number(newValue.sourceHe);
        this.blender.sourceTank.startPressure = Number(newValue.sourcePressure);
        this.blender.topMix.o2 = Number(newValue.topMixO2);
        this.blender.topMix.he = Number(newValue.topMixHe);
        this.blender.targetTank.o2 = Number(newValue.targetO2);
        this.blender.targetTank.he = Number(newValue.targetHe);
        this.blender.targetTank.startPressure = Number(newValue.targetPressure);
        this.blender.calculate();
    }

    public applyTemplate(): void {
        if(this.blenderForm.invalid) {
            return;
        }

        this.blenderForm.patchValue({
            sourceO2: this.blender.sourceTank.o2,
            sourceHe: this.blender.sourceTank.he,
            topMixO2: this.blender.topMix.o2,
            topMixHe: this.blender.topMix.he,
            targetO2: this.blender.targetTank.o2,
            targetHe: this.blender.targetTank.he
        });

        this.applyChange();
    }

    // TODO Gas blender component:
    // Do we need Reload?
    // add service tests
    // save/load state
}
