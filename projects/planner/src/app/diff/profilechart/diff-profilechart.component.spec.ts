import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileDifferenceChartComponent } from './diff-profilechart.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { ChartPlotterFactory } from '../../shared/chartPlotter';

describe('ProfileDifferenceChartComponent', () => {
    let component: ProfileDifferenceChartComponent;
    let fixture: ComponentFixture<ProfileDifferenceChartComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileDifferenceChartComponent],
            providers: [
                UnitConversion,
                SelectedWaypoint,
                ProfileComparatorService,
                ResamplingService,
                DiveSchedules,
                ReloadDispatcher,
                SelectedDiffWaypoint,
                ChartPlotterFactory
            ]
        });
        fixture = TestBed.createComponent(ProfileDifferenceChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
