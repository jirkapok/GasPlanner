import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { StandardGases, Tank } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';

@Component({
    selector: 'app-oxygen',
    templateUrl: './oxygen.component.html',
    styleUrls: ['./oxygen.component.scss']
})
export class OxygenComponent implements OnInit {
    @Input()
    public tank = new Tank(15, 200, 21);
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
        public units: UnitConversion) {
        this.nitroxNames = StandardGases.nitroxNames();
    }

    public get gasO2Invalid(): boolean {
        const gasO2 = this.nitroxForm.controls.o2;
        return this.inputs.controlInValid(gasO2);
    }

    public ngOnInit(): void {
        const ranges = this.units.ranges;

        this.nitroxForm = this.fb.group({
            o2: [this.inputs.formatNumber(this.tank.o2),
                [Validators.required, Validators.min(ranges.nitroxOxygen[0]), Validators.max(ranges.nitroxOxygen[1])]]
        });
    }

    public fireAssignBestMix(): void {
        this.assignBestMix.emit();
        this.reload();
    }

    public fireGasChanged(): void {
        if(this.gasO2Invalid) {
            return;
        }

        const newValue = this.nitroxForm.controls.o2.value;
        this.tank.o2 = Number(newValue);
        this.gasChange.emit();
    }

    public assignStandardGas(gasName: string): void {
        this.tank.assignStandardGas(gasName);
        this.reload();
        this.fireGasChanged();
    }

    private reload(): void {
        this.nitroxForm.patchValue({
            o2: this.inputs.formatNumber(this.tank.o2)
        });
    }
}
