import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GasConsumedDifferenceTankComponent } from './diff-gas-consumed-tank-chart.component';
import {UnitConversion} from '../../../../shared/UnitConversion';

describe('GasConsumedDifferenceTankComponent', () => {
    let component: GasConsumedDifferenceTankComponent;
    let fixture: ComponentFixture<GasConsumedDifferenceTankComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GasConsumedDifferenceTankComponent],
            providers: [UnitConversion]
        })
            .compileComponents();

        fixture = TestBed.createComponent(GasConsumedDifferenceTankComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
