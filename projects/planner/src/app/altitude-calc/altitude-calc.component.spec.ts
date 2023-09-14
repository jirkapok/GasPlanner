import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AltitudeCalcComponent } from './altitude-calc.component';
import { UnitConversion } from '../shared/UnitConversion';

describe('AltitudeCalcComponent', () => {
    let component: AltitudeCalcComponent;
    let fixture: ComponentFixture<AltitudeCalcComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AltitudeCalcComponent],
            providers: [UnitConversion]
        });
        fixture = TestBed.createComponent(AltitudeCalcComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
