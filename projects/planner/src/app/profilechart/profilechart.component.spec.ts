import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileChartComponent } from './profilechart.component';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { WayPointsService } from '../shared/waypoints.service';
import { SelectedWaypoint } from '../shared/selectedwaypointService';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';

describe('ProfileChartComponent', () => {
    let component: ProfileChartComponent;
    let fixture: ComponentFixture<ProfileChartComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileChartComponent],
            providers: [
                PlannerService, WorkersFactoryCommon,
                WayPointsService, SelectedWaypoint,
                UnitConversion, DiveSchedules,
                ReloadDispatcher
            ]
        });

        fixture = TestBed.createComponent(ProfileChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
