import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DiveInfoDifferenceComponent} from './diff-diveinfo.component';
import {ViewSwitchService} from '../../shared/viewSwitchService';
import {UnitConversion} from '../../shared/UnitConversion';
import {ProfileComparatorService} from '../../shared/profileComparatorService';
import {DiveSchedules} from '../../shared/dive.schedules';
import {ReloadDispatcher} from '../../shared/reloadDispatcher';

describe('DiveInfoDifferenceComponent', () => {
    let component: DiveInfoDifferenceComponent;
    let fixture: ComponentFixture<DiveInfoDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveInfoDifferenceComponent],
            providers: [
                ViewSwitchService,
                DiveSchedules,
                ReloadDispatcher,
                UnitConversion,
                ProfileComparatorService
            ]
        });
        fixture = TestBed.createComponent(DiveInfoDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
