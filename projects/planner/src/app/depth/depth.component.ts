import { Component, OnInit } from '@angular/core';
import { NonNullableFormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Precision } from 'scuba-physics';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';

@Component({
    selector: 'app-depth',
    templateUrl: './depth.component.html',
    styleUrls: ['./depth.component.scss']
})
export class DepthComponent implements OnInit {
    public depthForm!: FormGroup<{
        depth: FormControl<number>;
    }>;

    constructor(private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion,
        public depths: DepthsService) { }

    public get depthInvalid(): boolean {
        const depthField = this.depthForm.controls.depth;
        return this.inputs.controlInValid(depthField);
    }

    public depthChanged() {
        if (this.depthForm.invalid) {
            return;
        }

        const newValue = this.depthForm.controls.depth.value;
        this.depths.plannedDepth = Number(newValue);
    }

    public applyMaxDepth(): void {
        this.depths.applyMaxDepth();
        this.depthForm.patchValue({
            depth: Precision.round(this.depths.plannedDepth, 1)
        });
    }

    public ngOnInit(): void {
        this.depthForm = this.fb.group({
            depth: [Precision.round(this.depths.plannedDepth, 1), this.validators.depth]
        });
    }
}
