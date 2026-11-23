import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import * as Plotly from 'plotly.js-dist';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { TraceKind } from '../../shared/chartPlotter';
import { CircuitType, HighestDensity, ProfileTissues, Segment, StandardGases, TissueOverPressures } from 'scuba-physics';
import { ProfileChartComponent } from './profilechart.component';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { UnitConversion } from '../../shared/UnitConversion';
import { WayPointsService } from '../../shared/waypoints.service';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { RestIntervalTissues } from '../../shared/restIntervalTissues';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { ResamplingService } from '../../shared/ResamplingService';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';
import { StopsFilter } from '../../shared/stopsFilter.service';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { WayPoint } from '../../shared/wayPoint';
import { ViewStates } from '../../shared/viewStates';
import { SubViewStorage } from '../../shared/subViewStorage';
import { PreferencesStore } from '../../shared/preferencesStore';
import { Preferences } from '../../shared/preferences';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';
import { LanguageService } from '../../shared/language.service';

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
                ViewStates, SubViewStorage, PreferencesStore, Preferences,
                ApplicationSettingsService, LanguageService,
                DatePipe, ValidatorGroups,
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
        schedules.selected.diveResult.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], [], 0, [], []);

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

    describe('Chart legend', () => {
        const point = (uid: string, y: number, text = ''): Plotly.PlotDatum =>
            ({ x: '1970-02-01 00:29:00', y, text, data: { uid } }) as unknown as Plotly.PlotDatum;

        const hover = (...points: Plotly.PlotDatum[]): void => {
            component.plotlyHover({ points } as unknown as Plotly.PlotMouseEvent);
            fixture.detectChanges();
        };

        const legendText = (): string => {
            const line = fixture.debugElement.query(By.css('[data-testid="chart-legend"]'));
            return (line.nativeElement as HTMLElement).textContent?.trim() ?? '';
        };

        it('reserves empty chart legend when not hovering', () => {
            expect(fixture.debugElement.query(By.css('[data-testid="chart-legend"]'))).toBeTruthy();
            expect(legendText()).toBe('');
        });

        it('shows chart legend values while hovering', () => {
            hover(
                point(TraceKind.averageDepth, 25.6),
                point(TraceKind.depth, 21),
                point(TraceKind.ceiling, 5),
                point(TraceKind.events, 21, 'Gas switch to EAN50')
            );

            const text = legendText();
            expect(text).toContain('profileChart.depthTraceName');
            expect(text).toContain('profileChart.avgDepthTraceName');
            expect(text).toContain('profileChart.ceilingTraceName');
            expect(text).toContain('Gas switch to EAN50');
            const values = fixture.debugElement.queryAll(By.css('[data-testid="chart-legend"] .legend-value'))
                .map(v => (v.nativeElement as HTMLElement).textContent?.trim());
            expect(values).toEqual(['21 m', '25.6 m', '5 m']);
        });

        // the same samples as in plotly legend: line style of each trace, filled area of ceiling and marker of events
        it('shows line sample like in legend in front of each value', () => {
            hover(
                point(TraceKind.averageDepth, 25.6),
                point(TraceKind.depth, 21),
                point(TraceKind.ceiling, 5),
                point(TraceKind.emergency, 18),
                point(TraceKind.events, 21, 'Gas switch to EAN50')
            );

            const markers = fixture.debugElement.queryAll(By.css('[data-testid="chart-legend"] .legend-marker'))
                .map(m => getComputedStyle(m.nativeElement as HTMLElement));
            const lines = markers.map(m => `${m.borderTopStyle} ${m.borderTopColor}`);
            expect(lines.slice(0, 4)).toEqual([
                'solid rgb(31, 119, 180)',
                'dotted rgb(62, 157, 223)',
                'solid rgb(255, 160, 73)',
                'dashed rgb(255, 77, 77)'
            ]);
            // ceiling line color rgb(255, 160, 73) at 50 %
            expect(markers[2].backgroundColor).toBe('color(srgb 1 0.627451 0.286275 / 0.5)');
            expect(markers[4].backgroundColor).toBe('rgba(31, 119, 180, 0.7)');
            expect(markers[4].borderRadius).toBe('50%');
        });

        it('keeps marker together with its value when the line wraps', () => {
            hover(point(TraceKind.depth, 21), point(TraceKind.events, 21, 'Gas switch to EAN50'));

            const entries = fixture.debugElement.queryAll(By.css('[data-testid="chart-legend"] .legend-marker'))
                .map(m => (m.nativeElement as HTMLElement).parentElement as HTMLElement);
            expect(entries.length).toBe(2);
            entries.forEach(e => expect(getComputedStyle(e).whiteSpace).toBe('nowrap'));
        });

        it('aligns chart legend left with start padding', () => {
            const line = fixture.debugElement.query(By.css('[data-testid="chart-legend"]')).nativeElement as HTMLElement;

            expect(getComputedStyle(line).textAlign).toBe('start');
            expect(getComputedStyle(line).paddingLeft).toBe('48px');
        });

        it('separates chart legend values with enough space', () => {
            hover(point(TraceKind.averageDepth, 25.6), point(TraceKind.depth, 21));
            const line = fixture.debugElement.query(By.css('[data-testid="chart-legend"]')).nativeElement as HTMLElement;
            const time = line.firstElementChild as HTMLElement;
            const separator = line.querySelector('.legend-separator') as HTMLElement;

            expect(getComputedStyle(time).marginRight).toBe('16px');
            expect(getComputedStyle(separator).marginLeft).toBe('8px');
            expect(getComputedStyle(separator).marginRight).toBe('8px');
        });

        it('names emergency line emergency for open circuit', () => {
            hover(point(TraceKind.emergency, 18));

            expect(legendText()).toContain('profileChart.emergencyTraceName');
        });

        it('names emergency line bailout for rebreather', () => {
            TestBed.inject(DiveSchedules).selectedOptions.circuit = CircuitType.mccr;
            hover(point(TraceKind.emergency, 18));

            const text = legendText();
            expect(text).toContain('profileChart.bailoutTraceName');
            expect(text).not.toContain('profileChart.emergencyTraceName');
        });

        it('hides emergency and events when absent', () => {
            hover(point(TraceKind.depth, 21));

            const text = legendText();
            expect(text).not.toContain('profileChart.emergencyTraceName');
            expect(text).not.toContain('profileChart.ceilingTraceName');
        });

        it('keeps chart legend height, so the chart does not move', () => {
            // wide enough to show the values on one line, the test browser frame is narrow
            (fixture.nativeElement as HTMLElement).style.display = 'block';
            (fixture.nativeElement as HTMLElement).style.width = '1000px';
            const line = fixture.debugElement.query(By.css('[data-testid="chart-legend"]')).nativeElement as HTMLElement;
            const emptyHeight = line.getBoundingClientRect().height;

            hover(point(TraceKind.averageDepth, 25.6), point(TraceKind.depth, 21));

            expect(line.getBoundingClientRect().height).toBe(emptyHeight);
        });

        it('shows hours in hover time on long dives', () => {
            const longDivePoint = ({ x: '1970-02-01 01:05:30', y: 21, text: '', data: { uid: TraceKind.depth } }) as
                unknown as Plotly.PlotDatum;

            hover(longDivePoint);

            expect(legendText()).toContain('1:05:30');
        });

        it('clears values when selected dive changes', () => {
            hover(point(TraceKind.depth, 21));

            TestBed.inject(ReloadDispatcher).sendSelectedChanged(2);
            fixture.detectChanges();

            expect(legendText()).toBe('');
        });

        it('clears values when emergency ascent is switched', () => {
            hover(point(TraceKind.emergency, 18));

            component.switchEmergencyAscent();
            fixture.detectChanges();

            expect(legendText()).toBe('');
        });

        it('clears values when language changes', async () => {
            hover(point(TraceKind.depth, 21));

            await firstValueFrom(TestBed.inject(TranslateService).use('cs'));
            fixture.detectChanges();

            expect(legendText()).toBe('');
        });

        it('clears values on unhover', () => {
            hover(point(TraceKind.depth, 21));

            component.plotlyHoverLeave();
            fixture.detectChanges();

            expect(legendText()).toBe('');
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
                ViewStates, SubViewStorage, PreferencesStore, Preferences,
                ApplicationSettingsService, LanguageService,
                ValidatorGroups, provideTestTranslate()
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

    it('bailout profile tab doesn\'t switch on the emergency ascent overlay', async () => {
        TestBed.inject(DiveSchedules).selectedOptions.circuit = CircuitType.mccr;
        TestBed.inject(ReloadDispatcher).sendOptionsChanged();

        TestBed.inject(ViewSwitchService).showBailoutProfile = true;
        await fixture.whenStable();

        expect(fixture.componentInstance.showEmergencyAscent).toBe(false);
    });

    it('dive profile tab doesn\'t switch off the emergency ascent overlay', async () => {
        TestBed.inject(DiveSchedules).selectedOptions.circuit = CircuitType.mccr;
        TestBed.inject(ReloadDispatcher).sendOptionsChanged();
        const viewSwitch = TestBed.inject(ViewSwitchService);
        fixture.componentInstance.switchEmergencyAscent();
        viewSwitch.showBailoutProfile = true;
        await fixture.whenStable();

        viewSwitch.showBailoutProfile = false;
        await fixture.whenStable();

        expect(fixture.componentInstance.showEmergencyAscent).toBe(true);
    });
});

describe('ProfileChartComponent rest interval', () => {
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
                ViewStates, SubViewStorage, PreferencesStore, Preferences,
                ApplicationSettingsService, LanguageService,
                DatePipe, ValidatorGroups,
                provideTestTranslate()
            ]
        });
        vi.spyOn(TestBed.inject(PreferencesStore), 'save').mockImplementation(() => {});
    });

    const createChart = async (): Promise<void> => {
        fixture = TestBed.createComponent(ProfileChartComponent);
        (fixture.nativeElement as HTMLElement).style.display = 'block';
        (fixture.nativeElement as HTMLElement).style.width = '300px';
        fixture.detectChanges();
        await fixture.whenStable();
    };

    const intervalInput = (): HTMLInputElement =>
        fixture.debugElement.query(By.css('[data-testid="interval-input"]')).nativeElement as HTMLInputElement;

    const enterInterval = async (value: string): Promise<void> => {
        intervalInput().value = value;
        intervalInput().dispatchEvent(new Event('input'));
        fixture.detectChanges();
        await fixture.whenStable();
    };

    it('loads rest interval from dashboard view state', async () => {
        TestBed.inject(SubViewStorage).restInterval = 3600;

        await createChart();

        expect(intervalInput().value).toBe('01:00');
    });

    it('saves changed rest interval into dashboard view state', async () => {
        await createChart();

        await enterInterval('00:30');

        expect(TestBed.inject(SubViewStorage).restInterval).toBe(1800);
    });

    it('heat map uses the rest interval', async () => {
        TestBed.inject(DiveSchedules).selected.diveResult.updateProfile([], ProfileTissues.createAtSurface(0), []);
        await createChart();
        const heatMapButton = fixture.debugElement.query(By.css('[data-testid="heat-map-button"]')).nativeElement as HTMLButtonElement;
        heatMapButton.click();
        await fixture.whenStable();
        const overPressures = vi.spyOn(RestIntervalTissues.prototype, 'calculate');

        await enterInterval('00:30');
        // lets Plotly promises settle, so an unhandled rejection fails this spec
        await new Promise((resolve) => setTimeout(resolve));

        expect(overPressures).toHaveBeenLastCalledWith(expect.anything(), expect.any(Number), 1800);
    });
    it('does not calculate heat map tissues while heat map is hidden', async () => {
        await createChart();
        const overPressures = vi.spyOn(RestIntervalTissues.prototype, 'calculate');
        const schedules = TestBed.inject(DiveSchedules);

        TestBed.inject(ReloadDispatcher).sendInfoCalculated(schedules.selected.id);

        expect(overPressures).not.toHaveBeenCalled();
    });

    it('keeps rest interval when another dive is selected', async () => {
        TestBed.inject(SubViewStorage).restInterval = 1800;
        const schedules = TestBed.inject(DiveSchedules);
        schedules.add();
        await createChart();
        const heatMapButton = fixture.debugElement.query(By.css('[data-testid="heat-map-button"]')).nativeElement as HTMLButtonElement;
        heatMapButton.click();
        await fixture.whenStable();
        const overPressures = vi.spyOn(RestIntervalTissues.prototype, 'calculate');

        schedules.setSelectedIndex(1);
        await fixture.whenStable();
        await new Promise((resolve) => setTimeout(resolve));

        expect(overPressures).toHaveBeenLastCalledWith(expect.anything(), expect.any(Number), 1800);
        expect(intervalInput().value).toBe('00:30');
    });

    it('shows hours on time axis when rest interval extends the chart past one hour', async () => {
        const segment = new Segment(30, 0, StandardGases.air, 2400);
        const wayPoint = WayPoint.fromSegment(TestBed.inject(UnitConversion), segment);
        TestBed.inject(DiveSchedules).selected.diveResult.updateProfile([wayPoint], ProfileTissues.createAtSurface(0), [segment]);
        TestBed.inject(SubViewStorage).restInterval = 7200;

        await createChart();
        await new Promise((resolve) => setTimeout(resolve));

        const chart = document.getElementById('diveplot') as Plotly.PlotlyHTMLElement;
        expect(chart.layout.xaxis?.tickformat).toBe('%H:%M:%S');
    });
    it('plots heat map with rest interval tissues', async () => {
        const segment = new Segment(30, 0, StandardGases.air, 600);
        const wayPoint = WayPoint.fromSegment(TestBed.inject(UnitConversion), segment);
        const dive = TestBed.inject(DiveSchedules).selected.diveResult;
        dive.updateProfile([wayPoint], ProfileTissues.createAtSurface(0), [segment]);
        const diveRow = new Array<number>(16).fill(0) as TissueOverPressures;
        dive.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [diveRow], [], 0, [], []);
        TestBed.inject(SubViewStorage).restInterval = 600;
        await createChart();

        const heatMapButton = fixture.debugElement.query(By.css('[data-testid="heat-map-button"]')).nativeElement as HTMLButtonElement;
        heatMapButton.click();
        await fixture.whenStable();
        await new Promise((resolve) => setTimeout(resolve));

        const heatMap = document.getElementById('heatmapplot') as Plotly.PlotlyHTMLElement;
        const z = (heatMap.data[0] as Partial<Plotly.HeatmapData>).z as number[][];
        expect(z[0].length).toBe(601);
    });
    it('cancels heat map tissues calculation when new profile is calculated', async () => {
        await createChart();
        const cancel = vi.spyOn(RestIntervalTissues.prototype, 'cancel');
        const schedules = TestBed.inject(DiveSchedules);

        TestBed.inject(ReloadDispatcher).sendWayPointsCalculated(schedules.selected.id);

        expect(cancel).toHaveBeenCalled();
    });
});
