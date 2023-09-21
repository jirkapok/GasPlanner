import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltitudeCalcComponent } from './altitude-calc.component';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { DecimalPipe } from '@angular/common';

describe('AltitudeCalcComponent', () => {
    let component: AltitudeCalcComponent;
    let fixture: ComponentFixture<AltitudeCalcComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AltitudeCalcComponent],
            providers: [
                UnitConversion, ValidatorGroups, InputControls,
                DecimalPipe
            ]
        });
        fixture = TestBed.createComponent(AltitudeCalcComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
