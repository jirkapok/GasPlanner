import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WaypointsDifferenceComponent} from './diff-waypoints.component';
import {UnitConversion} from '../../shared/UnitConversion';
import {ProfileComparatorService} from '../../shared/diff/profileComparatorService';
import {DiveSchedules} from '../../shared/dive.schedules';
import {ReloadDispatcher} from '../../shared/reloadDispatcher';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';

describe('WaypointsDifferenceComponent', () => {
    let component: WaypointsDifferenceComponent;
    let fixture: ComponentFixture<WaypointsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaypointsDifferenceComponent],
            providers: [
                UnitConversion,
                ProfileComparatorService,
                DiveSchedules,
                ReloadDispatcher,
                SelectedDiffWaypoint
            ]
        });
        fixture = TestBed.createComponent(WaypointsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
