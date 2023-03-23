import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { Precision, StandardGases, Tank } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { TankBound } from '../shared/models';

@Component({
    selector: 'app-oxygen',
    templateUrl: './oxygen.component.html',
    styleUrls: ['./oxygen.component.scss']
})
export class OxygenComponent {
    @Input()
    public tank = new TankBound(new Tank(15, 200, 21), this.units);
    @Input()
    public toxicity = new GasToxicity();
    @Input()
    public showBestMix = true;
    @Input()
    public nitroxForm!: FormGroup;

    @Output()
    public gasChange = new EventEmitter();

    @Output()
    public assignBestMix = new EventEmitter();

    public nitroxNames: string[];

    constructor(private fb: NonNullableFormBuilder,
        private validators: ValidatorGroups,
        public units: UnitConversion) {
        this.nitroxNames = StandardGases.nitroxNames();
        this.nitroxForm = this.fb.group({
            o2: [Precision.round(this.tank.o2, 1), this.validators.nitroxOxygen]
        });
    }

    public fireAssignBestMix(): void {
        this.assignBestMix.emit();
        this.reload();
    }

    public fireGasChanged(): void {
        this.gasChange.emit();
    }

    private reload(): void {
        this.nitroxForm.patchValue({
            o2: Precision.round(this.tank.o2, 1)
        });
    }
}
