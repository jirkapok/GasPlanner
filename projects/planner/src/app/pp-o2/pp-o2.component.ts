import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { Precision } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';

@Component({
    selector: 'app-pp-o2',
    templateUrl: './pp-o2.component.html',
    styleUrls: ['./pp-o2.component.scss']
})
export class PpO2Component implements OnInit {
    @Input() public maxPpO2 = 1.4;
    @Input() public label = '';
    @Input() public controlName = 'maxPpO2';
    @Input() public pO2Form!: FormGroup;
    @Output() public ppO2Change = new EventEmitter<number>();

    constructor(private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) { }

    public get ppO2Invalid(): boolean {
        const maxPpO2Field = this.pO2Form.get(this.controlName);
        return !maxPpO2Field || this.inputs.controlInValid(maxPpO2Field);
    }

    public ngOnInit(): void {
        if (!this.pO2Form) {
            this.pO2Form = this.fb.group({});
        }

        const maxPpO2Control = this.fb.control(Precision.round(this.maxPpO2, 2), this.validators.ppO2);
        this.pO2Form.addControl(this.controlName, maxPpO2Control);
    }

    public fireChanged(): void {
        if (this.ppO2Invalid) {
            return;
        }

        const maxPpO2Control = this.pO2Form.get(this.controlName);
        const newValue = Number(maxPpO2Control?.value);
        this.ppO2Change.emit(newValue);
    }
}
