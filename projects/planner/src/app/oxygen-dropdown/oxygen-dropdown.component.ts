import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { Precision, StandardGases, Tank } from 'scuba-physics';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { TankBound } from '../shared/models';

@Component({
    selector: 'app-oxygen-dropdown',
    templateUrl: './oxygen-dropdown.component.html',
    styleUrls: ['./oxygen-dropdown.component.scss']
})
export class OxygenDropDownComponent implements OnInit {
    @Input() public showBestMix = true;
    @Input() public showTitle = true;
    @Input() public showTrimixGases = false;
    @Input() public controlName = 'o2';
    @Input() public tank = new TankBound(new Tank(15, 200, 21), this.units);
    @Input() public nitroxForm!: FormGroup;
    @Output() public gasChange = new EventEmitter<number>();
    @Output() public assignBestMix = new EventEmitter();
    @Output() public standardGasApplied = new EventEmitter<string>();

    constructor(private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) {
    }

    public get standardGases(): string[] {
        if (this.showTrimixGases) {
            return StandardGases.allNames();
        }

        return StandardGases.nitroxNames();
    }

    public get o2Ranges(): [number, number] {
        const ranges = this.units.ranges;
        if (this.showTrimixGases) {
            return ranges.trimixOxygen;
        }

        return ranges.nitroxOxygen;
    }

    public get o2RangeLabel(): string {
        const ranges = this.units.ranges;
        if (this.showTrimixGases) {
            return ranges.trimixOxygenLabel;
        }

        return ranges.nitroxOxygenLabel;
    }

    public get gasO2Invalid(): boolean {
        const o2Field = this.nitroxForm.get(this.controlName);
        return !o2Field || this.inputs.controlInValid(o2Field);
    }

    public ngOnInit(): void {
        if (!this.nitroxForm) {
            this.nitroxForm = this.fb.group({});
        }

        const oO2Control = this.fb.control(Precision.round(this.tank.o2, 1), this.validators.nitroxOxygen);
        this.nitroxForm.addControl(this.controlName, oO2Control);
    }

    public fireAssignBestMix(): void {
        this.assignBestMix.emit();
        this.reload();
    }

    public gasInputChanged(): void {
        if (this.gasO2Invalid) {
            return;
        }

        this.updateOxygenValue();
        this.gasChange.emit(this.tank.o2);
    }

    public assignStandardGas(gasName: string): void {
        this.tank.tank.assignStandardGas(gasName);
        this.reload();
        this.standardGasApplied.emit(gasName);
    }

    public updateOxygenValue(): void {
        const o2Field = this.nitroxForm.get(this.controlName);
        const newValue = Number(o2Field?.value);
        this.tank.o2 = newValue;
    }

    private reload(): void {
        this.nitroxForm.patchValue({
            [this.controlName]: Precision.round(this.tank.o2, 1)
        });
    }
}
