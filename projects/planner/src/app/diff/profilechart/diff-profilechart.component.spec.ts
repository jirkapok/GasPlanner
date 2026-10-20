import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileDifferenceChartComponent } from './diff-profilechart.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';

describe('ProfileDifferenceChartComponent', () => {
    let component: ProfileDifferenceChartComponent;
    let fixture: ComponentFixture<ProfileDifferenceChartComponent>;
    let heatMapButton: HTMLButtonElement;
    let alignByEndButton: HTMLButtonElement;

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

        alignByEndButton = fixture.nativeElement.querySelector('[data-testid="align-by-end-button"]');
        heatMapButton = fixture.nativeElement.querySelector('[data-testid="heat-map-button"]');
    });

    it('creates', () => {
        expect(component).toBeTruthy();
        expect(heatMapButton).toBeTruthy();
        expect(alignByEndButton).toBeTruthy();
    });

    it('has functional heatMap button', () => {
        const valueBefore = component.showHeatMap;

        heatMapButton.click();

        const valueAfter = component.showHeatMap;
        expect(valueAfter).not.toEqual(valueBefore);
    });

    it('has functional alignByEnd button', () => {
        const diff = TestBed.inject(ProfileComparatorService);
        const valueBefore = diff.alignByEnd;

        alignByEndButton.click();

        const valueAfter = diff.alignByEnd;
        expect(valueAfter).not.toEqual(valueBefore);
    });
});
