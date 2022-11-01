import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-depth',
    templateUrl: './depth.component.html',
    styleUrls: ['./depth.component.css']
})
export class DepthComponent{
    @Input()
    public bestMix = '';

    /** In metres */
    @Input()
    public depth = 30;

    @Output()
    public applyMaxDepth = new EventEmitter();

    @Output()
    public inputChange = new EventEmitter<number>();

    public depthForm!: FormGroup;

    constructor(private fb: FormBuilder,
        private numberPipe: DecimalPipe,
        public units: UnitConversion){}

    public get boundDepth(): number {
        return this.units.fromMeters(this.depth);
    }

    public get depthInvalid(): boolean {
        const depthField = this.depthForm.controls.depth;
        return InputControls.controlInValid(depthField);
    }

    public depthChanged() {
        const newValue = this.depthForm.controls.depth.value as number;
        this.depth = this.units.toMeters(newValue);
        this.inputChange.emit(this.depth);
    }

    public ngOnInit(): void {
        const ranges = this.units.ranges;
        this.depthForm = this.fb.group({
            depth: [InputControls.formatNumber(this.numberPipe, this.boundDepth),
                [Validators.required, Validators.min(ranges.depth[0]), Validators.max(ranges.depth[1])]]
        });
    }

    public fireApplyMaxDepth(): void {
        this.applyMaxDepth.emit();
    }
}
