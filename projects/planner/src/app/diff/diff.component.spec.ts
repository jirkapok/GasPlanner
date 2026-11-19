import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { DiffComponent } from './diff.component';
import { ProfileComparatorService } from '../shared/diff/profileComparatorService';
import { DiveSchedules } from '../shared/dive.schedules';
import { UnitConversion } from '../shared/UnitConversion';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { SubViewStorage } from '../shared/subViewStorage';
import { KnownViews, ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { ApplicationSettingsService } from '../shared/ApplicationSettings';
import { ResamplingService } from '../shared/ResamplingService';
import { SelectedDiffWaypoint } from '../shared/diff/selected-diff-waypoint.service';
import { GasesComparisonService } from '../shared/diff/gases-comparison.service';
import { ResultsComparison } from '../shared/diff/results-comparison.service';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';
import { LanguageService } from '../shared/language.service';
import { DiffViewState } from '../shared/views.model';
import { ValidatorGroups } from '../shared/ValidatorGroups';

describe('DiffComponent', () => {
    const defaultState = {
        id: KnownViews.diff,
        profileA: 0,
        profileB: 0,
        alignByEnd: false,
        restInterval: 0
    };
    let component: DiffComponent;
    let fixture: ComponentFixture<DiffComponent>;
    let states: SubViewStorage;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DiffComponent],
            providers: [
                ProfileComparatorService,
                DiveSchedules, UnitConversion,
                ViewStates, SubViewStorage,
                PreferencesStore, Preferences,
                ViewSwitchService, ReloadDispatcher,
                ApplicationSettingsService, ResamplingService,
                SelectedDiffWaypoint, GasesComparisonService,
                ResultsComparison, MdbModalService,
                ValidatorGroups, provideNoopAnimations(),
                provideTestTranslate(), LanguageService
            ]
        });
        fixture = TestBed.createComponent(DiffComponent);
        component = fixture.componentInstance;
        states = TestBed.inject(SubViewStorage);
    });

    it('creates', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('navigates to dashboard', async () => {
        fixture.detectChanges();
        const router = TestBed.inject(Router);
        await component.goToDashboard();
        expect(router.url).toBe('/');
    });

    it('creates diff state when there is none', () => {
        const stateBeforeInit = states.loadView(KnownViews.diff);
        fixture.detectChanges();
        const stateAfterInit = states.loadView(KnownViews.diff);

        expect(stateBeforeInit).toBeUndefined();
        expect(stateAfterInit).toEqual(defaultState);
    });

    it('does not modify diff state', () => {
        const customState = { ...defaultState, alignByEnd: true };
        states.saveView(customState);
        fixture.detectChanges();

        const stateAfterInit = states.loadView(KnownViews.diff);
        expect(stateAfterInit).toEqual(customState);
    });

    describe('Rest interval', () => {
        const intervalInput = (): HTMLInputElement =>
            fixture.debugElement.query(By.css('[data-testid="interval-input"]')).nativeElement as HTMLInputElement;

        const enterInterval = async (value: string): Promise<void> => {
            intervalInput().value = value;
            intervalInput().dispatchEvent(new Event('input'));
            fixture.detectChanges();
            await fixture.whenStable();
        };

        const diffRestInterval = (): number | undefined =>
            states.loadView<DiffViewState>(KnownViews.diff)?.restInterval;

        beforeEach(() => {
            vi.spyOn(TestBed.inject(PreferencesStore), 'save').mockImplementation(() => {});
        });

        it('loads rest interval from diff state', async () => {
            states.saveView({ ...defaultState, restInterval: 3600 });

            fixture.detectChanges();
            await fixture.whenStable();

            expect(intervalInput().value).toBe('01:00');
        });

        it('loads 0 for diff state without rest interval', async () => {
            states.saveView({ id: KnownViews.diff, profileA: 0, profileB: 0, alignByEnd: false });

            fixture.detectChanges();
            await fixture.whenStable();

            expect(intervalInput().value).toBe('00:00');
            expect(diffRestInterval()).toBe(0);
        });

        it('saves changed rest interval into diff state', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            await enterInterval('00:30');

            expect(diffRestInterval()).toBe(1800);
        });

        it('keeps dashboard rest interval', async () => {
            states.restInterval = 600;
            fixture.detectChanges();
            await fixture.whenStable();

            await enterInterval('00:30');

            expect(states.restInterval).toBe(600);
        });
    });
});
