import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileChartComponent } from './profilechart.component';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { WayPointsService } from '../shared/waypoints.service';
import { SelectedWaypoint } from '../shared/selectedwaypointService';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { ResamplingService } from '../shared/ResamplingService';

describe('ProfileChartComponent', () => {
    let component: ProfileChartComponent;
    let fixture: ComponentFixture<ProfileChartComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileChartComponent],
            providers: [
                WorkersFactoryCommon, ReloadDispatcher,
                WayPointsService, SelectedWaypoint,
                UnitConversion, DiveSchedules,
                ResamplingService,
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
