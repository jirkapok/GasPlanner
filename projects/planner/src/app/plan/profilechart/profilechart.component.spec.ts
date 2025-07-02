import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileChartComponent } from './profilechart.component';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { UnitConversion } from '../../shared/UnitConversion';
import { WayPointsService } from '../../shared/waypoints.service';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { ResamplingService } from '../../shared/ResamplingService';

describe('ProfileChartComponent', () => {
    let component: ProfileChartComponent;
    let fixture: ComponentFixture<ProfileChartComponent>;
    let units: UnitConversion;

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
        units = TestBed.inject(UnitConversion);

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    xit('should display default deco stop distance in normal and emergency ascent chart', () => {
        const selected = TestBed.inject(DiveSchedules).selected;

        spyOnProperty(selected, 'diveResult', 'get').and.returnValue({
            wayPoints: [{ startTime: 0, endTime: 1, startDepth: 3, endDepth: 3 }],
            emergencyAscent: [{ startTime: 0, endTime: 1, startDepth: 3, endDepth: 3 }]
        } as any);

        units.imperialUnits = false;
        component['plotAllCharts']();
        let traces = (component as any).plotter.builders[0].allTraces();
        let depths = traces.find((t: any) => t.name.includes('Depth'));
        expect(depths).toBeDefined();
        expect((depths.y as number[]).some(y => y === 3)).toBeTrue();

        units.imperialUnits = true;
        component['plotAllCharts']();
        traces = (component as any).plotter.builders[0].allTraces();
        depths = traces.find((t: any) => t.name.includes('Depth'));
        expect(depths).toBeDefined();
        expect((depths.y as number[]).some(y => y === 10)).toBeTrue();

        units.imperialUnits = false;
        (component as any).plotter.builders[0].showEmergencyAscent = true;
        component['plotAllCharts']();
        traces = (component as any).plotter.builders[0].allTraces();
        let emergency = traces.find((t: any) => t.name.includes('Emergency'));
        expect(emergency).toBeDefined();
        expect((emergency.y as number[]).some(y => y === 3)).toBeTrue();

        units.imperialUnits = true;
        component['plotAllCharts']();
        traces = (component as any).plotter.builders[0].allTraces();
        emergency = traces.find((t: any) => t.name.includes('Emergency'));
        expect(emergency).toBeDefined();
        expect((emergency.y as number[]).some(y => y === 10)).toBeTrue();
    });
});










