import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-depth',
    templateUrl: './depth.component.html',
    styleUrls: ['./depth.component.css']
})
export class DepthComponent implements OnInit {
    public depthForm!: FormGroup;

    constructor(private fb: FormBuilder,
        private inputs: InputControls,
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
            depth: this.inputs.formatNumber(this.depths.plannedDepth)
        });
    }

    public ngOnInit(): void {
        const ranges = this.units.ranges;
        this.depthForm = this.fb.group({
            depth: [this.inputs.formatNumber(this.depths.plannedDepth),
            [Validators.required, Validators.min(ranges.depth[0]), Validators.max(ranges.depth[1])]]
        });
    }
}
