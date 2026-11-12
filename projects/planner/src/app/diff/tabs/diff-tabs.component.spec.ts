import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiffTabsComponent } from './diff-tabs.component';
import { DiveSchedules } from '../../shared/dive.schedules';
import { UnitConversion } from '../../shared/UnitConversion';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { TranslateService } from '@ngx-translate/core';
import { CircuitType } from 'scuba-physics';
import { useEnglishCircuitNames } from '../../shared/circuit-names.testing';

describe('DiffTabsComponent', () => {
    let component: DiffTabsComponent;
    let fixture: ComponentFixture<DiffTabsComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DiffTabsComponent],
            providers: [
                DiveSchedules, UnitConversion,
                ReloadDispatcher, ProfileComparatorService,
                provideAnimations(), provideTestTranslate()
            ]
        });

        fixture = TestBed.createComponent(DiffTabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('selection buttons show the circuit of every dive', async () => {
        useEnglishCircuitNames(TestBed.inject(TranslateService));
        const schedules = TestBed.inject(DiveSchedules);
        schedules.add().optionsService.circuit = CircuitType.mccr;
        TestBed.inject(ReloadDispatcher).sendOptionsChanged();
        fixture.detectChanges();
        await fixture.whenStable();

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain('1. OC 30 m');
        expect(text).toContain('2. mCCR 30 m');
    });
});
