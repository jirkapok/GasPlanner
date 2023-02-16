import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { StandardGases, Tank } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { InputControls } from '../shared/inputcontrols';
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

    @Output()
    public gasChange = new EventEmitter();

    @Output()
    public assignBestMix = new EventEmitter();

    public nitroxForm!: UntypedFormGroup;

    public nitroxNames: string[];

    constructor(private fb: UntypedFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) {
        this.nitroxNames = StandardGases.nitroxNames();
        this.nitroxForm = this.fb.group({
            o2: [this.inputs.formatNumber(this.tank.o2), this.validators.nitroxOxygen]
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
            o2: this.inputs.formatNumber(this.tank.o2)
        });
    }
}
