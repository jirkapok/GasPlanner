import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-pp-o2',
    templateUrl: './pp-o2.component.html',
    styleUrls: ['./pp-o2.component.css']
})
export class PpO2Component implements OnInit {
    @Input() public maxPpO2 = 1.4;
    @Input() public label = '';
    @Input() public controlName = 'maxPpO2';
    @Input() public pO2Form!: UntypedFormGroup;
    @Output() public ppO2Change = new EventEmitter<number>();

    constructor(private fb: UntypedFormBuilder,
        private inputs: InputControls,
        public units: UnitConversion) { }

    public get ppO2Invalid(): boolean {
        const maxPpO2Field = this.pO2Form.get(this.controlName);
        return !maxPpO2Field || this.inputs.controlInValid(maxPpO2Field);
    }

    public ngOnInit(): void {
        if (!this.pO2Form) {
            this.pO2Form = this.fb.group({});
        }

        const ranges = this.units.ranges;
        const maxPpO2Control = this.fb.control(this.inputs.formatNumber(this.maxPpO2),
            [Validators.required, Validators.min(ranges.ppO2[0]), Validators.max(ranges.ppO2[1])]);
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
