import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GasConsumedDifferenceComponent } from './diff-gas-consumed.component';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';
import {DiveSchedules} from '../../../shared/dive.schedules';
import {UnitConversion} from '../../../shared/UnitConversion';
import {ReloadDispatcher} from '../../../shared/reloadDispatcher';

describe('DiffGasConsumedComponent', () => {
    let component: GasConsumedDifferenceComponent;
    let fixture: ComponentFixture<GasConsumedDifferenceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GasConsumedDifferenceComponent],
            providers: [
                ProfileComparatorService,
                DiveSchedules,
                UnitConversion,
                ReloadDispatcher
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(GasConsumedDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // TODO extract getMixedTanks to separate service, see also methods in dif-gas-consumed-tank-chart
    it('Creates compared gases', () => {
        expect(component.getMixedTanks).not.toBeNull();
    });
});
