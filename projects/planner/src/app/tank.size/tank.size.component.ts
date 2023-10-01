import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { Precision, Tank, TankTemplate } from 'scuba-physics';
import { AbstractControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { TankBound } from '../shared/models';
import { InputControls } from '../shared/inputcontrols';

@Component({
    selector: 'app-tank-size',
    templateUrl: './tank.size.component.html',
    styleUrls: ['./tank.size.component.scss']
})
export class TankSizeComponent implements OnInit {
    @Input() public sizeForm!: FormGroup;
    @Input() public controlName = 'tankSize';
    @Input() public tank: TankBound;
    @Output() public sizeChange = new EventEmitter<number>();
    @Output() public applyTemplate = new EventEmitter<TankTemplate>();

    constructor(private units: UnitConversion,
        private fb: NonNullableFormBuilder,
        private inputs: InputControls,
        private validators: ValidatorGroups) {
        const source = Tank.createDefault();
        this.tank = new TankBound(source, this.units);
        const tankDefaults = this.units.defaults.tanks;
        this.tank.workingPressure = tankDefaults.primary.workingPressure;
        this.tank.size = tankDefaults.primary.size;
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get allDefaultTanks(): TankTemplate[] {
        return this.units.defaults.tanks.available;
    }

    public get tankSizeInvalid(): boolean {
        const tankSize = this.sizeForm.get(this.controlName) as AbstractControl;
        return this.inputs.controlInValid(tankSize);
    }

    public ngOnInit(): void {
        if (!this.sizeForm) {
            this.sizeForm = this.fb.group({});
        }

        const initSize = Precision.round(this.tank.size, 1);
        const sizeControl = this.fb.control(initSize, this.validators.tankSize);
        this.sizeForm.addControl(this.controlName, sizeControl);
    }

    public sizeChanged(): void {
        if (this.sizeForm.invalid) {
            return;
        }

        const sizeField = this.sizeForm.get(this.controlName);
        const newValue = Number(sizeField?.value);
        this.tank.size = newValue;
        this.sizeChange.emit(newValue);
    }

    public assignTankTemplate(template: TankTemplate): void {
        this.tank.assignTemplate(template);
        this.sizeForm.patchValue({
            [this.controlName]: Precision.round(this.tank.size, 1) // because of precision for HP100
        });
        // side effect, it didn't change the size only, but the working pressure too
        this.applyTemplate.emit(template);
    }
}
