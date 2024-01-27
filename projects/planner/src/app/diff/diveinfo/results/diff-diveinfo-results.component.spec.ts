import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DiveInfoResultsDifferenceComponent} from './diff-diveinfo-results.component';
import {ViewSwitchService} from '../../../shared/viewSwitchService';
import {DiveSchedules} from '../../../shared/dive.schedules';
import {ReloadDispatcher} from '../../../shared/reloadDispatcher';
import {UnitConversion} from '../../../shared/UnitConversion';
import {ProfileComparatorService} from '../../../shared/profileComparatorService';

describe('DiveInfoResultsDifferenceComponent', () => {
    let component: DiveInfoResultsDifferenceComponent;
    let fixture: ComponentFixture<DiveInfoResultsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveInfoResultsDifferenceComponent],
            providers: [
                ViewSwitchService,
                DiveSchedules,
                ReloadDispatcher,
                UnitConversion,
                ProfileComparatorService
            ]
        });
        fixture = TestBed.createComponent(DiveInfoResultsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
