import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiffComponent } from './diff.component';
import { ProfileComparatorService } from '../shared/diff/profileComparatorService';
import { DiveSchedules } from '../shared/dive.schedules';
import { UnitConversion } from '../shared/UnitConversion';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { ApplicationSettingsService } from '../shared/ApplicationSettings';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ResamplingService } from '../shared/ResamplingService';
import { SelectedDiffWaypoint } from '../shared/diff/selected-diff-waypoint.service';
import { GasesComparisonService } from '../shared/diff/gases-comparison.service';
import { ResultsComparison } from '../shared/diff/results-comparison.service';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('DiffComponent', () => {
    let component: DiffComponent;
    let fixture: ComponentFixture<DiffComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DiffComponent],
            providers: [
                ProfileComparatorService,
                DiveSchedules,
                UnitConversion,
                ViewStates,
                SubViewStorage,
                PreferencesStore,
                Preferences,
                ViewSwitchService,
                ReloadDispatcher,
                ApplicationSettingsService,
                ResamplingService,
                SelectedDiffWaypoint,
                GasesComparisonService,
                ResultsComparison,
                MdbModalService,
                provideNoopAnimations()
            ]
        });
        fixture = TestBed.createComponent(DiffComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
