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
});
