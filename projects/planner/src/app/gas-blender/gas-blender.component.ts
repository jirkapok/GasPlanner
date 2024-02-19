import { Component } from '@angular/core';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';

@Component({
    selector: 'app-gas-blender',
    templateUrl: './gas-blender.component.html',
    styleUrls: ['./gas-blender.component.scss']
})
export class GasBlenderComponent {
    public readonly calcIcon = faCalculator;
    public blenderForm!: FormGroup;

    constructor(private fb: NonNullableFormBuilder) {
        this.blenderForm = this.fb.group([]);
    }
}
