import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import * as Plotly from 'plotly.js-dist';
import { firstValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { TraceKind } from '../../shared/chartPlotter';
import { ProfileTissues } from 'scuba-physics';
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
        expect(component.showHeatMap).toBeTrue();
        expect(heatMap.classList).toContain('plot-display');
        expect(plot?.getAttribute('width')).toEqual(heatMap.clientWidth.toString());
    });

    it('shows legend above the chart', async () => {
        // lets Plotly promises settle
        await new Promise((resolve) => setTimeout(resolve));

        const plot = document.getElementById('diveplot') as unknown as { layout: Partial<Plotly.Layout> };
        expect(plot.layout.showlegend).toBeTrue();
        expect(plot.layout.legend?.orientation).toBe('h');
    });

    describe('Hover values in legend', () => {
        interface PlotElement {
            data: Partial<Plotly.PlotData>[];
            layout: Partial<Plotly.Layout>;
        }

        // lets Plotly promises settle
        const settle = (): Promise<unknown> => new Promise((resolve) => setTimeout(resolve));
        const plotElement = (): PlotElement => document.getElementById('diveplot') as unknown as PlotElement;
        const traceNames = (): string[] => plotElement().data.map(t => t.name ?? '');
        const hoverTitle = (): string => plotElement().layout.title?.text ?? '';

        const point = (uid: string, y: number, text = '', x = '1970-02-01 00:29:00'): Plotly.PlotDatum =>
            ({ x, y, text, data: { uid } }) as unknown as Plotly.PlotDatum;

        const hover = async (...points: Plotly.PlotDatum[]): Promise<void> => {
            await settle();
            component.plotlyHover({ points } as unknown as Plotly.PlotMouseEvent);
            await settle();
        };

        const plainNames = [
            'profileChart.avgDepthTraceName',
            'profileChart.depthTraceName',
            'profileChart.ceilingTraceName',
            'profileChart.eventTraceName'
        ];

        it('shows plain names and no title when not hovering', async () => {
            await settle();

            expect(traceNames()).toEqual(plainNames);
            expect(hoverTitle()).toBe('');
        });

        it('shows hovered values in legend entries', async () => {
            await hover(point(TraceKind.averageDepth, 25.6), point(TraceKind.depth, 21), point(TraceKind.ceiling, 5));

            expect(traceNames()).toEqual([
                'profileChart.avgDepthTraceName 25.6 m',
                'profileChart.depthTraceName 21 m',
                'profileChart.ceilingTraceName 5 m',
                'profileChart.eventTraceName'
            ]);
        });

        it('shows time and events in hover title', async () => {
            await hover(point(TraceKind.depth, 21), point(TraceKind.events, 21, 'Gas switch to EAN50'));

            expect(hoverTitle()).toBe('29:00 | Gas switch to EAN50');
        });

        it('shows only time in hover title without events', async () => {
            await hover(point(TraceKind.depth, 21));

            expect(hoverTitle()).toBe('29:00');
        });

        it('shows hours in hover title on long dives', async () => {
            await hover(point(TraceKind.depth, 21, '', '1970-02-01 01:05:30'));

            expect(hoverTitle()).toBe('1:05:30');
        });

        it('shows emergency value when emergency ascent is shown', async () => {
            component.switchEmergencyAscent();

            await hover(point(TraceKind.emergency, 18));

            expect(traceNames()).toContain('profileChart.emergencyTraceName 18 m');
        });

        it('restores plain names on unhover', async () => {
            await hover(point(TraceKind.depth, 21), point(TraceKind.events, 21, 'Gas switch to EAN50'));

            component.plotlyHoverLeave();
            await settle();

            expect(traceNames()).toEqual(plainNames);
            expect(hoverTitle()).toBe('');
        });

        it('restores plain names when selected dive changes', async () => {
            await hover(point(TraceKind.depth, 21));

            TestBed.inject(ReloadDispatcher).sendSelectedChanged(2);
            await settle();

            expect(traceNames()).toEqual(plainNames);
            expect(hoverTitle()).toBe('');
        });

        it('restores plain names when language changes', async () => {
            await hover(point(TraceKind.depth, 21));

            await firstValueFrom(TestBed.inject(TranslateService).use('cs'));
            await settle();

            expect(traceNames()).toEqual(plainNames);
            expect(hoverTitle()).toBe('');
        });
    });
});
