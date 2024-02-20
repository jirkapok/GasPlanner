import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DiveResultsResultsDifferenceComponent} from './diff-diveresults-results.component';
import {ViewSwitchService} from '../../../shared/viewSwitchService';
import {DiveSchedules} from '../../../shared/dive.schedules';
import {ReloadDispatcher} from '../../../shared/reloadDispatcher';
import {UnitConversion} from '../../../shared/UnitConversion';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';

describe('DiveResultsResultsDifferenceComponent', () => {
    let component: DiveResultsResultsDifferenceComponent;
    let fixture: ComponentFixture<DiveResultsResultsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveResultsResultsDifferenceComponent],
            providers: [
                ViewSwitchService,
                DiveSchedules,
                ReloadDispatcher,
                UnitConversion,
                ProfileComparatorService
            ]
        });
        fixture = TestBed.createComponent(DiveResultsResultsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
