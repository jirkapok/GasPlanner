import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-pp-o2',
    templateUrl: './pp-o2.component.html',
    styleUrls: ['./pp-o2.component.css']
})
export class PpO2Component implements OnInit {
    @Input()
    public maxPpO2 = 1.4;

    @Input()
    public label = '';

    @Output()
    public ppO2Change = new EventEmitter<number>();

    public pO2Form!: FormGroup;

    constructor(private fb: FormBuilder,
        private numberPipe: DecimalPipe,
        public units: UnitConversion) { }

    public get ppO2Invalid(): boolean {
        const maxPpO2Field = this.pO2Form.controls.maxPpO2;
        return maxPpO2Field.invalid && (maxPpO2Field.dirty || maxPpO2Field.touched);
    }

    public ngOnInit(): void {
        const ranges = this.units.ranges;

        this.pO2Form = this.fb.group({
            maxPpO2: [InputControls.formatNumber(this.numberPipe, this.maxPpO2),
                [Validators.required, Validators.min(ranges.ppO2[0]), Validators.max(ranges.ppO2[1])]],
        });
    }

    public fireChanged(): void {
        if(this.ppO2Invalid) {
            return;
        }

        const newValue = this.pO2Form.controls.maxPpO2.value as number;
        this.ppO2Change.emit(newValue);
    }
}
