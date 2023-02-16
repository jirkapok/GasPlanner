import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { StandardGases, Tank } from 'scuba-physics';
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
    @Input() public controlName = 'o2';
    @Input() public tank = new TankBound(new Tank(15, 200, 21), this.units);
    @Input() public nitroxForm!: UntypedFormGroup;
    @Output() public gasChange = new EventEmitter<number>();
    @Output() public assignBestMix = new EventEmitter();

    public nitroxNames: string[];

    constructor(private fb: UntypedFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups,
        public units: UnitConversion) {
        this.nitroxNames = StandardGases.nitroxNames();
    }

    public get gasO2Invalid(): boolean {
        const o2Field = this.nitroxForm.get(this.controlName);
        return !o2Field || this.inputs.controlInValid(o2Field);
    }

    public ngOnInit(): void {
        if (!this.nitroxForm) {
            this.nitroxForm = this.fb.group({});
        }

        const oO2Control = this.fb.control(this.inputs.formatNumber(this.tank.o2), this.validators.nitroxOxygen);
        this.nitroxForm.addControl(this.controlName, oO2Control);
    }

    public fireAssignBestMix(): void {
        this.assignBestMix.emit();
        this.reload();
    }

    public fireGasChanged(): void {
        if(this.gasO2Invalid) {
            return;
        }

        const o2Field = this.nitroxForm.get(this.controlName);
        const newValue = Number(o2Field?.value);
        this.gasChange.emit(newValue);
    }

    public assignStandardGas(gasName: string): void {
        this.tank.tank.assignStandardGas(gasName);
        this.reload();
        this.fireGasChanged();
    }

    private reload(): void {
        this.nitroxForm.patchValue({
            [this.controlName]: this.inputs.formatNumber(this.tank.o2)
        });
    }
}
