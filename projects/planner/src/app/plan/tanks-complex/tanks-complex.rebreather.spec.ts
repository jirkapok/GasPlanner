import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CircuitType } from 'scuba-physics';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { provideAnimations } from '@angular/platform-browser/animations';
import { TanksComplexComponent } from './tanks-complex.component';
import { InputControls } from '../../shared/inputcontrols';
import { PlannerService } from '../../shared/planner.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { UnitConversion } from '../../shared/UnitConversion';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { WayPointsService } from '../../shared/waypoints.service';
import { ViewStates } from '../../shared/viewStates';
import { Preferences } from '../../shared/preferences';
import { PreferencesStore } from '../../shared/preferencesStore';
import { SubViewStorage } from '../../shared/subViewStorage';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { LanguageService } from '../../shared/language.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';

describe('Tanks Complex component - Rebreather', () => {
    let fixture: ComponentFixture<TanksComplexComponent>;
    let schedules: DiveSchedules;
    let optionsChangedSpy: jasmine.Spy<() => void>;

    const element = (selector: string): HTMLElement | undefined =>
        fixture.debugElement.query(By.css(selector))?.nativeElement as HTMLElement | undefined;

    /** dropdown menu is rendered into overlay only after it is opened */
    const selectCircuit = (itemId: string): void => {
        element('#circuitType')?.click();
        fixture.detectChanges();
        (document.querySelector(itemId) as HTMLElement).click();
        fixture.detectChanges();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                WorkersFactoryCommon, UnitConversion,
                PlannerService, InputControls,
                ValidatorGroups, DecimalPipe, ViewSwitchService,
                WayPointsService, SubViewStorage, ViewStates,
                Preferences, PreferencesStore, DiveSchedules,
                ReloadDispatcher, MdbModalService,
                provideAnimations(), LanguageService, provideTestTranslate(),
            ],
            imports: [ReactiveFormsModule, TanksComplexComponent]
        }).compileComponents();

        schedules = TestBed.inject(DiveSchedules);
        optionsChangedSpy = spyOn(TestBed.inject(ReloadDispatcher), 'sendOptionsChanged').and.callFake(() => { });
        fixture = TestBed.createComponent(TanksComplexComponent);
        fixture.detectChanges();
    });

    it('open circuit has no rebreather options', () => {
        expect(element('app-rebreather-options')).toBeUndefined();
    });

    it('selecting pSCR switches circuit and fires options change', () => {
        selectCircuit('#circuitPscr');

        expect(schedules.selectedOptions.circuit).toBe(CircuitType.pscr);
        expect(optionsChangedSpy).toHaveBeenCalledWith();
    });

    it('rebreather shows tanks and rebreather tabs', () => {
        selectCircuit('#circuitPscr');

        expect(element('#tanksTab')).toBeDefined();
        expect(element('#rebreatherTab')).toBeDefined();
        expect(element('app-rebreather-options')).toBeUndefined();
    });

    it('rebreather tab shows options and remembers the selection', () => {
        selectCircuit('#circuitPscr');
        element('#rebreatherTab')?.click();
        fixture.detectChanges();

        expect(element('app-rebreather-options')).toBeDefined();
        expect(TestBed.inject(ViewSwitchService).rebreatherTab).toBeTrue();
    });

    it('selecting open circuit switches back', () => {
        selectCircuit('#circuitPscr');
        selectCircuit('#circuitOc');

        expect(schedules.selectedOptions.isRebreather).toBeFalse();
    });
});
