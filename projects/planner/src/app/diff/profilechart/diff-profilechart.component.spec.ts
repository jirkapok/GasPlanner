import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProfileDifferenceChartComponent } from './diff-profilechart.component';
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
});
