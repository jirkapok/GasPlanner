import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
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

describe('DiffComponent', () => {
    const defaultState = {
        id: KnownViews.diff,
        profileA: 0,
        profileB: 0,
        alignByEnd: false
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
                provideNoopAnimations(), provideTestTranslate(), LanguageService
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

    it("doesn't modify diff state", () => {
        const customState = {...defaultState, alignByEnd: true };
        states.saveView(customState);
        fixture.detectChanges();

        const stateAfterInit = states.loadView(KnownViews.diff);
        expect(stateAfterInit).toEqual(customState);
    });
});
