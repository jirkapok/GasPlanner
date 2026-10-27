import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HighestDensity, ProfileTissues } from 'scuba-physics';
import { ProfileChartComponent } from './profilechart.component';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { UnitConversion } from '../../shared/UnitConversion';
import { WayPointsService } from '../../shared/waypoints.service';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { ResamplingService } from '../../shared/ResamplingService';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';

describe('ProfileChartComponent', () => {
    let component: ProfileChartComponent;
    let fixture: ComponentFixture<ProfileChartComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ProfileChartComponent],
            providers: [
                WorkersFactoryCommon, ReloadDispatcher,
                WayPointsService, SelectedWaypoint,
                UnitConversion, DiveSchedules,
                ResamplingService, MdbModalService,
                provideTestTranslate()
            ]
        });

        fixture = TestBed.createComponent(ProfileChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('plots heat map when heat map is switched on', async () => {
        // narrower than Plotly default 700px width used for hidden elements
        (fixture.nativeElement as HTMLElement).style.display = 'block';
        (fixture.nativeElement as HTMLElement).style.width = '300px';
        const schedules = TestBed.inject(DiveSchedules);
        schedules.selected.diveResult.updateProfile([], ProfileTissues.createAtSurface(0), []);

        const heatMapButton = fixture.debugElement.query(By.css('[data-testid="heat-map-button"]')).nativeElement as HTMLButtonElement;
        heatMapButton.click();
        // lets Plotly promises settle, so an unhandled rejection fails this spec
        await new Promise((resolve) => setTimeout(resolve));

        const heatMap = fixture.debugElement.query(By.css('#heatmapplot')).nativeElement as HTMLElement;
        const plot = heatMap.querySelector('svg.main-svg');
        expect(component.showHeatMap).toBe(true);
        expect(heatMap.classList).toContain('plot-display');
        expect(plot?.getAttribute('width')).toEqual(heatMap.clientWidth.toString());
    });
});

describe('ProfileChartComponent OnPush', () => {
    let fixture: ComponentFixture<ProfileChartComponent>;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [ProfileChartComponent],
            providers: [
                WorkersFactoryCommon, ReloadDispatcher,
                WayPointsService, SelectedWaypoint,
                UnitConversion, DiveSchedules,
                ResamplingService, MdbModalService,
                provideTestTranslate()
            ]
        });

        fixture = await renderOnPush(ProfileChartComponent);
    });

    it('renders calculating indicator hidden after info calculated outside Angular events', async () => {
        const calculating = (): Element | null => (fixture.nativeElement as HTMLElement).querySelector('app-calculating .spinner-grow');
        expect(calculating()).not.toBeNull();

        const dive = TestBed.inject(DiveSchedules).selected.diveResult;
        dive.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], [], 0, [], []);
        await fixture.whenStable();

        expect(calculating()).toBeNull();
    });
});
