import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import * as Plotly from 'plotly.js-dist';
import { TraceKind } from '../../shared/chartPlotter';
import { CircuitType, HighestDensity, ProfileTissues } from 'scuba-physics';
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
import { StopsFilter } from '../../shared/stopsFilter.service';
import { ViewSwitchService } from '../../shared/viewSwitchService';

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
                StopsFilter, ViewSwitchService,
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

    describe('Hover values', () => {
        const point = (uid: string, y: number, text = ''): Plotly.PlotDatum =>
            ({ x: '1970-02-01 00:29:00', y, text, data: { uid } }) as unknown as Plotly.PlotDatum;

        const hover = (...points: Plotly.PlotDatum[]): void => {
            component.plotlyHover({ points } as unknown as Plotly.PlotMouseEvent);
            fixture.detectChanges();
        };

        const hoverText = (): string => {
            const line = fixture.debugElement.query(By.css('[data-testid="hover-values"]'));
            return (line.nativeElement as HTMLElement).textContent?.trim() ?? '';
        };

        it('reserves empty hover line when not hovering', () => {
            expect(fixture.debugElement.query(By.css('[data-testid="hover-values"]'))).toBeTruthy();
            expect(hoverText()).toBe('');
        });

        it('shows hover values while hovering', () => {
            hover(
                point(TraceKind.averageDepth, 25.6),
                point(TraceKind.depth, 21),
                point(TraceKind.ceiling, 5),
                point(TraceKind.events, 21, 'Gas switch to EAN50')
            );

            const text = hoverText();
            expect(text).toContain('profileChart.depthTraceName');
            expect(text).toContain('21');
            expect(text).toContain('profileChart.avgDepthTraceName');
            expect(text).toContain('25.6');
            expect(text).toContain('profileChart.ceilingTraceName');
            expect(text).toContain('5');
            expect(text).toContain('Gas switch to EAN50');
            expect(text).toContain('m');
        });

        it('hides emergency and events when absent', () => {
            hover(point(TraceKind.depth, 21));

            const text = hoverText();
            expect(text).not.toContain('profileChart.emergencyTraceName');
            expect(text).not.toContain('profileChart.ceilingTraceName');
        });

        it('keeps hover line height, so the chart does not move', () => {
            // wide enough to show the values on one line, the test browser frame is narrow
            (fixture.nativeElement as HTMLElement).style.display = 'block';
            (fixture.nativeElement as HTMLElement).style.width = '1000px';
            const line = fixture.debugElement.query(By.css('[data-testid="hover-values"]')).nativeElement as HTMLElement;
            const emptyHeight = line.getBoundingClientRect().height;

            hover(point(TraceKind.averageDepth, 25.6), point(TraceKind.depth, 21));

            expect(line.getBoundingClientRect().height).toBe(emptyHeight);
        });

        it('clears values on unhover', () => {
            hover(point(TraceKind.depth, 21));

            component.plotlyHoverLeave();
            fixture.detectChanges();

            expect(hoverText()).toBe('');
        });
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
                StopsFilter, ViewSwitchService,
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

    it('bailout profile tab switches on the emergency ascent overlay', async () => {
        TestBed.inject(DiveSchedules).selectedOptions.circuit = CircuitType.mccr;
        TestBed.inject(ReloadDispatcher).sendOptionsChanged();
        const viewSwitch = TestBed.inject(ViewSwitchService);

        viewSwitch.showBailoutProfile = true;
        await fixture.whenStable();
        expect(fixture.componentInstance.showEmergencyAscent).toBe(true);

        viewSwitch.showBailoutProfile = false;
        await fixture.whenStable();
        expect(fixture.componentInstance.showEmergencyAscent).toBe(false);
    });
});
