import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { OptionDefaults, Precision } from 'scuba-physics';
import { InputControls } from '../../shared/inputcontrols';
import { Gradients, StandardGradientsService } from '../../shared/standard-gradients.service';
import { ValidatorGroups } from '../../shared/ValidatorGroups';

@Component({
    selector: 'app-gradients',
    templateUrl: './gradients.component.html',
    styleUrls: ['./gradients.component.scss'],
    standalone: false
})
export class GradientsComponent implements OnInit {
    @Input() public showTitle = false;
    @Input() public simple = false;
    @Input() public gfLow = OptionDefaults.gfLow;
    @Input() public gfHigh = OptionDefaults.gfHigh;
    @Input() public gfForm!: FormGroup;
    @Output() public inputChange = new EventEmitter<Gradients>();
    public readonly minGradient = ValidatorGroups.minGradient;
    public readonly maxGradient = ValidatorGroups.maxGradient;
    public standards = new StandardGradientsService();

    constructor(private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups) { }

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
        if (this.gfHighInvalid) {
            return;
        }

        const newValue = Number(this.gfForm.controls.gfHigh.value);
        this.gfHigh = newValue / 100;
        this.inputChange.emit(new Gradients(this.gfLow, this.gfHigh));
    }

    public gfLowChanged(): void {
        if (this.gfLowInvalid) {
            return;
        }

        const newValue = Number(this.gfForm.controls.gfLow.value);
        this.gfLow = newValue / 100;
        this.inputChange.emit(new Gradients(this.gfLow, this.gfHigh));
    }

    public ngOnInit(): void {
        if(!this.gfForm) {
            this.gfForm = this.fb.group({
                gfLow: [Precision.round(this.gfLow * 100, 1), this.validators.gradients],
                gfHigh: [Precision.round(this.gfHigh * 100, 1), this.validators.gradients]
            });
        }
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
            gfLow: Precision.round(this.gfLow * 100, 1),
            gfHigh: Precision.round(this.gfHigh * 100, 1),
            conservatism: this.conservatism
        });
        this.inputChange.emit(new Gradients(this.gfLow, this.gfHigh));
    }
}
