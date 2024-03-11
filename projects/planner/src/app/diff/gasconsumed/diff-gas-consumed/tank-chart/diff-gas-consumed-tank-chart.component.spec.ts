import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GasConsumedDifferenceTankComponent } from './diff-gas-consumed-tank-chart.component';
import {UnitConversion} from '../../../../shared/UnitConversion';
import {ProfileComparatorService} from '../../../../shared/profileComparatorService';
import {DiveSchedules} from '../../../../shared/dive.schedules';
import {ReloadDispatcher} from '../../../../shared/reloadDispatcher';

describe('GasConsumedDifferenceTankComponent', () => {
    let component: GasConsumedDifferenceTankComponent;
    let fixture: ComponentFixture<GasConsumedDifferenceTankComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GasConsumedDifferenceTankComponent],
            providers: [UnitConversion, ProfileComparatorService, DiveSchedules, ReloadDispatcher]
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
