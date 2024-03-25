import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    DiveResultsTableDifferenceComponent
} from './diff-diveresults-table.component';
import { ViewSwitchService } from '../../../shared/viewSwitchService';
import { DiveSchedules } from '../../../shared/dive.schedules';
import { ReloadDispatcher } from '../../../shared/reloadDispatcher';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { ResultsComparison } from '../../../shared/diff/results-comparison.service';

describe('DiveResultsTableDifferenceComponent', () => {
    let component: DiveResultsTableDifferenceComponent;
    let fixture: ComponentFixture<DiveResultsTableDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveResultsTableDifferenceComponent],
            providers: [
                ViewSwitchService,
                DiveSchedules,
                ReloadDispatcher,
                UnitConversion,
                ProfileComparatorService,
                ResultsComparison
            ]
        });
        fixture = TestBed.createComponent(DiveResultsTableDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
