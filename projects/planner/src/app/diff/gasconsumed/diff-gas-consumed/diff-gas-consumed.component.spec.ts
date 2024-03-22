import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GasConsumedDifferenceComponent } from './diff-gas-consumed.component';
import { ProfileComparatorService } from '../../../shared/profileComparatorService';
import { DiveSchedules } from '../../../shared/dive.schedules';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ReloadDispatcher } from '../../../shared/reloadDispatcher';
import { GasesComparisonService } from '../../../shared/gases-comparison.service';

describe('DiffGasConsumedComponent', () => {
    let component: GasConsumedDifferenceComponent;
    let fixture: ComponentFixture<GasConsumedDifferenceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GasConsumedDifferenceComponent],
            providers: [
                GasesComparisonService,
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
});
