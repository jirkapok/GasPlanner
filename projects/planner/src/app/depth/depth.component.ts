import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { Precision } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';

@Component({
    selector: 'app-depth',
    templateUrl: './depth.component.html',
    styleUrls: ['./depth.component.scss']
})
export class DepthComponent implements OnInit {
    @Input() public depthForm!: FormGroup;
    @Input() public controlName = 'depth';
    @Input() public bestNitroxMix = '';
    /** in respective units */
    @Input() public plannedDepth = 0;
    @Output() public depthChange = new EventEmitter<number>();
    @Output() public assignMaxDepth = new EventEmitter();

    constructor(private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) {
    }

    public get depthInvalid(): boolean {
        const depthField = this.depthForm.get(this.controlName);
        return !depthField || this.inputs.controlInValid(depthField);
    }

    public depthChanged() {
        if (this.depthForm.invalid) {
            return;
        }

        const depthField = this.depthForm.get(this.controlName);
        const newValue = Number(depthField?.value);
        this.depthChange.next(Number(newValue));
    }

    public applyMaxDepth(): void {
        this.assignMaxDepth.next({});
    }

    public ngOnInit(): void {
        if (!this.depthForm) {
            this.depthForm = this.fb.group({});
            const oO2Control = this.fb.control(Precision.round(this.plannedDepth, 1), this.validators.depth);
            this.depthForm.addControl(this.controlName, oO2Control);
        }
    }
}
