import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WaypointsDifferenceComponent} from './diff-waypoints.component';
import {UnitConversion} from '../../shared/UnitConversion';
import {WaypointsDifferenceService} from '../../shared/waypoints-difference.service';
import {ProfileComparatorService} from '../../shared/profileComparatorService';
import {DiveSchedules} from '../../shared/dive.schedules';
import {ReloadDispatcher} from '../../shared/reloadDispatcher';

describe('WaypointsDifferenceComponent', () => {
    let component: WaypointsDifferenceComponent;
    let fixture: ComponentFixture<WaypointsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaypointsDifferenceComponent],
            providers: [UnitConversion,
                WaypointsDifferenceService,
                ProfileComparatorService,
                DiveSchedules,
                ReloadDispatcher
            ]
        });
        fixture = TestBed.createComponent(WaypointsDifferenceComponent);
        component = fixture.componentInstance;
        component.data = new TestData();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
