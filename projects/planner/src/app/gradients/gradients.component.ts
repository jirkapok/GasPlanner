import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { OptionDefaults } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { Gradients, StandardGradientsService } from '../shared/standard-gradients.service';

@Component({
    selector: 'app-gradients',
    templateUrl: './gradients.component.html',
    styleUrls: ['./gradients.component.scss']
})
export class GradientsComponent implements OnInit {
    @Input()
    public showTitle = false;
    @Input()
    public simple = false;

    @Input()
    public gfLow = OptionDefaults.gfLow;
    @Input()
    public gfHigh = OptionDefaults.gfHigh;

    @Output()
    public inputChange = new EventEmitter<Gradients>();
    public standards = new StandardGradientsService();
    public gfForm!: UntypedFormGroup;

    constructor(private fb: UntypedFormBuilder,
        private inputs: InputControls) { }

    public get conservatism(): string {
        return this.standards.labelFor(this.gfLow, this.gfHigh);
    }

    public get gfLowInvalid(): boolean {
        const gfLowField = this.gfForm.controls.gfLow;
        return this.inputs.controlInValid(gfLowField);
    }

    public get gfHighInvalid(): boolean {
        const gfHighField = this.gfForm.controls.gfHigh;
        return this.inputs.controlInValid(gfHighField);
    }

    public gfHighChanged(): void {
        if(this.gfHighInvalid) {
            return;
        }

        const newValue = Number(this.gfForm.controls.gfHigh.value);
        this.gfHigh = newValue / 100;
        this.inputChange.emit(new Gradients(this.gfLow, this.gfHigh));
    }

    public gfLowChanged(): void {
        if(this.gfLowInvalid) {
            return;
        }

        const newValue = Number(this.gfForm.controls.gfLow.value);
        this.gfLow = newValue / 100;
        this.inputChange.emit(new Gradients(this.gfLow, this.gfHigh));
    }

    public ngOnInit(): void {
        this.gfForm = this.fb.group({
            gfLow: [this.inputs.formatNumber(this.gfLow * 100),
                [Validators.required, Validators.min(10), Validators.max(100)]],
            gfHigh: [this.inputs.formatNumber(this.gfHigh * 100),
                [Validators.required, Validators.min(10), Validators.max(100)]]
        });
    }

    public lowConservatism(): void {
        this.applyStandards(this.standards.lowName);
    }

    public mediumConservatism(): void {
        this.applyStandards(this.standards.mediumName);
    }

    public highConservatism(): void {
        this.applyStandards(this.standards.highName);
    }

    private applyStandards(label: string): void {
        const toApply = this.standards.get(label);
        this.gfLow = toApply.gfLow;
        this.gfHigh = toApply.gfHeigh;
        this.gfForm.patchValue({
            gfLow: this.inputs.formatNumber(this.gfLow * 100),
            gfHigh: this.inputs.formatNumber(this.gfHigh * 100),
            conservatism: this.conservatism
        });
        this.inputChange.emit(new Gradients(this.gfLow, this.gfHigh));
    }
}
