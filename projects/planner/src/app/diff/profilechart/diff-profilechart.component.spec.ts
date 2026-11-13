import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import * as Plotly from 'plotly.js-dist';
import { ProfileDifferenceChartComponent } from './diff-profilechart.component';
import { ChartPlotterFactory } from '../../shared/chartPlotter';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { ProfileTissues } from 'scuba-physics';

export class ProfileDifferenceChartPage {
    constructor(private fixture: ComponentFixture<ProfileDifferenceChartComponent>) { }

    public get heatMapButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('[data-testid="heat-map-button"]')).nativeElement as HTMLButtonElement;
    }

    public get alignByEndButton(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('[data-testid="align-by-end-button"]')).nativeElement as HTMLInputElement;
    }
}

describe('ProfileDifferenceChartComponent', () => {
    let component: ProfileDifferenceChartComponent;
    let fixture: ComponentFixture<ProfileDifferenceChartComponent>;
    let page: ProfileDifferenceChartPage;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ProfileDifferenceChartComponent],
            providers: [
                UnitConversion,
                SelectedWaypoint,
                ProfileComparatorService,
                ResamplingService,
                DiveSchedules,
                ReloadDispatcher,
                SelectedDiffWaypoint,
                DatePipe,
                provideTestTranslate()
            ]
        });
        fixture = TestBed.createComponent(ProfileDifferenceChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        page = new ProfileDifferenceChartPage(fixture);
    });

    it('creates', () => {
        expect(component).toBeTruthy();
        expect(page.heatMapButton).toBeTruthy();
        expect(page.alignByEndButton).toBeTruthy();
    });

    it('has functional heatMap button', () => {
        const valueBefore = component.showHeatMap;

        page.heatMapButton.click();

        const valueAfter = component.showHeatMap;
        expect(valueAfter).not.toEqual(valueBefore);
    });

    it('has functional alignByEnd button', () => {
        const diff = TestBed.inject(ProfileComparatorService);
        const valueBefore = diff.alignByEnd;

        page.alignByEndButton.click();

        const valueAfter = diff.alignByEnd;
        expect(valueAfter).not.toEqual(valueBefore);
    });

    it('plots heat maps when profiles are calculated after the view was rendered', async () => {
        const diff = TestBed.inject(ProfileComparatorService);
        const dispatcher = TestBed.inject(ReloadDispatcher);
        diff.profileAResults.updateProfile([], ProfileTissues.createAtSurface(0), []);
        diff.profileBResults.updateProfile([], ProfileTissues.createAtSurface(0), []);

        dispatcher.sendWayPointsCalculated();
        // lets Plotly promises settle, so an unhandled rejection fails this spec
        await new Promise((resolve) => setTimeout(resolve));

        const heatMap = fixture.debugElement.query(By.css('#heatmapPlotA')).nativeElement as HTMLElement;
        expect(heatMap.classList).toContain('plot-display');
        expect(heatMap.querySelector('svg.main-svg')).not.toBeNull();
    });

    it('plots heat maps when heat map is switched on', async () => {
        const diff = TestBed.inject(ProfileComparatorService);
        diff.profileAResults.updateProfile([], ProfileTissues.createAtSurface(0), []);
        diff.profileBResults.updateProfile([], ProfileTissues.createAtSurface(0), []);

        page.heatMapButton.click();
        page.heatMapButton.click();
        await new Promise((resolve) => setTimeout(resolve));

        const heatMap = fixture.debugElement.query(By.css('#heatmapPlotB')).nativeElement as HTMLElement;
        expect(component.showHeatMap).toBe(true);
        expect(heatMap.querySelector('svg.main-svg')).not.toBeNull();
    });

    describe('Hover values', () => {
        const point = (uid: string, y: number, text = ''): Plotly.PlotDatum =>
            ({ x: '1970-02-01 00:29:00', y, text, data: { uid } }) as unknown as Plotly.PlotDatum;

        const hover = async (): Promise<void> => {
            component.plotlyHover({
                points: [
                    point('diffResultsTable.profileB.depth', 6),
                    point('diffResultsTable.profileA.depth', 3),
                    point('diffResultsTable.profileA.events', 3, 'Safety stop')
                ]
            } as unknown as Plotly.PlotMouseEvent);
            await fixture.whenStable();
        };

        const row = (testId: string): HTMLElement =>
            fixture.debugElement.query(By.css(`[data-testid="${testId}"]`)).nativeElement as HTMLElement;
        const rowText = (testId: string): string => row(testId).textContent?.trim() ?? '';

        it('reserves empty rows when nothing is hovered', () => {
            expect(rowText('hover-time')).toBe('');
            expect(rowText('hover-values-a')).toBe('');
            expect(rowText('hover-values-b')).toBe('');
        });

        it('shows hovered time once and values of each profile in own row', async () => {
            await hover();

            expect(rowText('hover-time')).toBe('29:00');
            expect(rowText('hover-values-a')).toContain('diffResultsTable.profileA');
            expect(rowText('hover-values-a')).toContain('3 m');
            expect(rowText('hover-values-a')).toContain('Safety stop');
            expect(rowText('hover-values-a')).not.toContain('6 m');
            expect(rowText('hover-values-b')).toContain('diffResultsTable.profileB');
            expect(rowText('hover-values-b')).toContain('6 m');
            expect(rowText('hover-values-b')).not.toContain('29:00');
        });

        it('draws profile B samples in its line colors', async () => {
            await hover();

            const sample = row('hover-values-b').querySelector('.hover-marker') as HTMLElement;
            expect(getComputedStyle(sample).borderTopColor).toBe(ChartPlotterFactory.depthLineColorB);
        });

        it('clears hovered values on unhover', async () => {
            await hover();

            component.plotlyHoverLeave();
            await fixture.whenStable();

            expect(rowText('hover-time')).toBe('');
            expect(rowText('hover-values-a')).toBe('');
            expect(rowText('hover-values-b')).toBe('');
        });

        // touch devices don't always send unhover, values of other time alignment would be stale
        it('clears hovered values when profiles alignment changes', async () => {
            await hover();

            page.alignByEndButton.click();
            await fixture.whenStable();

            expect(rowText('hover-values-a')).toBe('');
        });

        it('hides plotly hover box', async () => {
            // lets Plotly promises settle
            await new Promise((resolve) => setTimeout(resolve));

            const plot = document.getElementById('diveplotdiff') as unknown as { layout: Partial<Plotly.Layout> };
            expect(plot.layout.hovermode).toBe('x');
        });
    });
});
