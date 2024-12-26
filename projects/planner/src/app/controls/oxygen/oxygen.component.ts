import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NonNullableFormBuilder, FormGroup } from '@angular/forms';
import { Tank, GasToxicity } from 'scuba-physics';
import { UnitConversion } from '../../shared/UnitConversion';
import { TankBound } from '../../shared/models';

@Component({
    selector: 'app-oxygen',
    templateUrl: './oxygen.component.html',
    styleUrls: ['./oxygen.component.scss']
})
export class OxygenComponent implements OnInit {
    @Input() public tank = new TankBound(new Tank(15, 200, 21), this.units);
    @Input() public toxicity = new GasToxicity();
    @Input() public showBestMix = true;
    @Input() public nitroxForm!: FormGroup;
    @Input() public controlName = 'o2';
    @Output() public gasChange = new EventEmitter<number>();
    @Output() public standardGasApplied = new EventEmitter<string>();
    @Output() public assignBestMix = new EventEmitter();

    constructor(
        private fb: NonNullableFormBuilder,
        public units: UnitConversion) {
    }

    public ngOnInit(): void {
        if (!this.nitroxForm) {
            this.nitroxForm = this.fb.group({});
        }
    }

    public fireAssignBestMix(): void {
        this.assignBestMix.emit();
    }
}
