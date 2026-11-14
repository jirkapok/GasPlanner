import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WaypointsDifferenceComponent } from './diff-waypoints.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { LanguageService } from '../../shared/language.service';
import { renderOnPush } from '../../../testing/onPush.testing';
import { compareTwoCalculatedDives, diffTestProviders, swapComparedProfiles } from '../../../testing/diff.testing';

describe('WaypointsDifferenceComponent', () => {
    let component: WaypointsDifferenceComponent;
    let fixture: ComponentFixture<WaypointsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [WaypointsDifferenceComponent],
            providers: [
                UnitConversion,
                ProfileComparatorService,
                DiveSchedules,
                ReloadDispatcher,
                SelectedDiffWaypoint,
                provideTestTranslate(),
                LanguageService
            ]
        });
        fixture = TestBed.createComponent(WaypointsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

describe('WaypointsDifferenceComponent OnPush', () => {
    let fixture: ComponentFixture<WaypointsDifferenceComponent>;

    const rows = (): NodeListOf<HTMLTableRowElement> =>
        (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [WaypointsDifferenceComponent],
            providers: diffTestProviders
        });
        fixture = await renderOnPush(WaypointsDifferenceComponent);
        compareTwoCalculatedDives();
        await fixture.whenStable();
    });

    it('renders difference calculated outside Angular events', () => {
        const difference = TestBed.inject(ProfileComparatorService).difference;
        expect(difference.length).toBeGreaterThan(0);
        expect(rows().length).toBe(difference.length);
    });

    it('renders difference of profiles swapped outside Angular events', async () => {
        const before = (fixture.nativeElement as HTMLElement).textContent;

        swapComparedProfiles();
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).textContent).not.toEqual(before);
    });

    it('renders way point selected in profile chart', async () => {
        const selected = TestBed.inject(ProfileComparatorService).difference[1];
        TestBed.inject(SelectedDiffWaypoint).selected = selected;
        await fixture.whenStable();

        expect(rows()[1].classList).toContain('table-active');
    });
});
