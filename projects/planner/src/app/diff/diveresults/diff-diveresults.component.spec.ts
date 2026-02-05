import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiveResultsDifferenceComponent } from './diff-diveresults.component';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { UnitConversion } from '../../shared/UnitConversion';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { ResultsComparison } from '../../shared/diff/results-comparison.service';

describe('DiveResultsDifferenceComponent', () => {
    let component: DiveResultsDifferenceComponent;
    let fixture: ComponentFixture<DiveResultsDifferenceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DiveResultsDifferenceComponent],
            providers: [ViewSwitchService, DiveSchedules, UnitConversion, ReloadDispatcher, ProfileComparatorService, ResultsComparison]
        }).compileComponents();
        fixture = TestBed.createComponent(DiveResultsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
