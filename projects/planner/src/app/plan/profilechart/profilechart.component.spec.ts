import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import * as Plotly from 'plotly.js-dist';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
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
                DatePipe, provideTestTranslate()
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

        it('shows circle marker in line color in front of each value', () => {
            hover(
                point(TraceKind.averageDepth, 25.6),
                point(TraceKind.depth, 21),
                point(TraceKind.ceiling, 5),
                point(TraceKind.emergency, 18),
                point(TraceKind.events, 21, 'Gas switch to EAN50')
            );

            const markers = fixture.debugElement.queryAll(By.css('[data-testid="hover-values"] .hover-marker'))
                .map(m => m.nativeElement as HTMLElement);
            const colors = markers.map(m => getComputedStyle(m).backgroundColor);
            expect(colors).toEqual([
                'rgb(31, 119, 180)',
                'rgb(62, 157, 223)',
                'rgb(255, 160, 73)',
                'rgb(255, 77, 77)',
                'rgba(31, 119, 180, 0.7)'
            ]);
            markers.forEach(m => expect(getComputedStyle(m).borderRadius).toBe('50%'));
        });

        it('keeps marker together with its value when the line wraps', () => {
            hover(point(TraceKind.depth, 21), point(TraceKind.events, 21, 'Gas switch to EAN50'));

            const entries = fixture.debugElement.queryAll(By.css('[data-testid="hover-values"] .hover-marker'))
                .map(m => (m.nativeElement as HTMLElement).parentElement as HTMLElement);
            expect(entries.length).toBe(2);
            entries.forEach(e => expect(getComputedStyle(e).whiteSpace).toBe('nowrap'));
        });

        it('aligns hover line left with start padding', () => {
            const line = fixture.debugElement.query(By.css('[data-testid="hover-values"]')).nativeElement as HTMLElement;

            expect(getComputedStyle(line).textAlign).toBe('start');
            expect(getComputedStyle(line).paddingLeft).toBe('48px');
        });

        it('hides emergency and events when absent', () => {
            hover(point(TraceKind.depth, 21));

            const text = hoverText();
            expect(text).not.toContain('profileChart.emergencyTraceName');
            expect(text).not.toContain('profileChart.ceilingTraceName');
        });

        it('keeps hover line height, so the chart does not move', () => {
            const line = fixture.debugElement.query(By.css('[data-testid="hover-values"]')).nativeElement as HTMLElement;
            const emptyHeight = line.getBoundingClientRect().height;

            hover(point(TraceKind.averageDepth, 25.6), point(TraceKind.depth, 21));

            expect(line.getBoundingClientRect().height).toBe(emptyHeight);
        });

        it('shows hours in hover time on long dives', () => {
            const longDivePoint = ({ x: '1970-02-01 01:05:30', y: 21, text: '', data: { uid: TraceKind.depth } }) as
                unknown as Plotly.PlotDatum;

            hover(longDivePoint);

            expect(hoverText()).toContain('1:05:30');
        });

        it('clears values when selected dive changes', () => {
            hover(point(TraceKind.depth, 21));

            TestBed.inject(ReloadDispatcher).sendSelectedChanged(2);
            fixture.detectChanges();

            expect(hoverText()).toBe('');
        });

        it('clears values when emergency ascent is switched', () => {
            hover(point(TraceKind.emergency, 18));

            component.switchEmergencyAscent();
            fixture.detectChanges();

            expect(hoverText()).toBe('');
        });

        it('clears values when language changes', async () => {
            hover(point(TraceKind.depth, 21));

            await firstValueFrom(TestBed.inject(TranslateService).use('cs'));
            fixture.detectChanges();

            expect(hoverText()).toBe('');
        });

        it('clears values on unhover', () => {
            hover(point(TraceKind.depth, 21));

            component.plotlyHoverLeave();
            fixture.detectChanges();

            expect(hoverText()).toBe('');
        });
    });
});
