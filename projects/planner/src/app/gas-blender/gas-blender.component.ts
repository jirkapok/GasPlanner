import { Component } from '@angular/core';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { BasBlenderService } from '../shared/gas-blender.service';

@Component({
    selector: 'app-gas-blender',
    templateUrl: './gas-blender.component.html',
    styleUrls: ['./gas-blender.component.scss']
})
export class GasBlenderComponent {
    public readonly calcIcon = faCalculator;
    public blenderForm!: FormGroup;

    constructor(
        public units: UnitConversion,
        private blender: BasBlenderService,
        private fb: NonNullableFormBuilder) {
        this.blenderForm = this.fb.group([]);
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get addO2(): number {
        return this.blender.addO2;
    }

    public get addHe(): number {
        return this.blender.addHe;
    }

    public get addTopMix(): number {
        return this.blender.addTop;
    }

    public get removeFromSource(): number {
        return this.blender.removeFromSource;
    }

    public get needsRemove(): boolean {
        return this.blender.needsRemove;
    }

    // TODO Gas blender component:
    // note we dont need working pressure, since dont count with volume only percentage
    // create and bind service with tests
    // add input controls and bind default values
    // On inputs change
    // On source mix template change
    // On top mix template change
    // On target mix template change
    // Do we need Reload?
    // bind results
    // save/load state
}
