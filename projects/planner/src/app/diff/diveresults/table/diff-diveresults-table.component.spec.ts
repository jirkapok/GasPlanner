import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
    DiveResultsTableDifferenceComponent
} from './diff-diveresults-table.component';
import { ViewSwitchService } from '../../../shared/viewSwitchService';
import { DiveSchedules } from '../../../shared/dive.schedules';
import { ReloadDispatcher } from '../../../shared/reloadDispatcher';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { ResultsComparison } from '../../../shared/diff/results-comparison.service';
import { provideTestTranslate } from '../../../../testing/translate-testing.helpers';
import { LanguageService } from '../../../shared/language.service';
import { renderOnPush } from '../../../../testing/onPush.testing';
import { TranslateService } from '@ngx-translate/core';
import { CircuitType } from 'scuba-physics';
import { useEnglishCircuitNames } from '../../../shared/circuit-names.testing';
import { compareTwoCalculatedDives, diffTestProviders, swapComparedProfiles } from '../../../../testing/diff.testing';

describe('DiveResultsTableDifferenceComponent', () => {
    let component: DiveResultsTableDifferenceComponent;
    let fixture: ComponentFixture<DiveResultsTableDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DiveResultsTableDifferenceComponent],
            providers: [
                ViewSwitchService,
                DiveSchedules,
                ReloadDispatcher,
                UnitConversion,
                ProfileComparatorService,
                ResultsComparison,
                provideTestTranslate(),
                LanguageService
            ]
        });
        fixture = TestBed.createComponent(DiveResultsTableDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

describe('DiveResultsTableDifferenceComponent OnPush', () => {
    let fixture: ComponentFixture<DiveResultsTableDifferenceComponent>;

    const text = (): string | null => (fixture.nativeElement as HTMLElement).textContent;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [DiveResultsTableDifferenceComponent],
            providers: diffTestProviders
        });
        fixture = await renderOnPush(DiveResultsTableDifferenceComponent);
    });

    it('renders results calculated outside Angular events', async () => {
        expect((fixture.nativeElement as HTMLElement).querySelector('#table-header')).toBeNull();

        compareTwoCalculatedDives();
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).querySelector('#table-header')).not.toBeNull();
    });

    it('profile titles show the circuit of compared dives', async () => {
        useEnglishCircuitNames(TestBed.inject(TranslateService));
        const first = TestBed.inject(DiveSchedules).selected;
        first.tanksService.prepareForClosedCircuit();
        first.optionsService.circuit = CircuitType.mccr;
        compareTwoCalculatedDives();
        await fixture.whenStable();

        expect(text()).toContain('1. mCCR 30 m');
        expect(text()).toContain('2. OC 40 m');
    });

    it('renders results of profiles swapped outside Angular events', async () => {
        compareTwoCalculatedDives();
        await fixture.whenStable();
        const before = text();

        swapComparedProfiles();
        await fixture.whenStable();

        expect(text()).not.toEqual(before);
    });
});
