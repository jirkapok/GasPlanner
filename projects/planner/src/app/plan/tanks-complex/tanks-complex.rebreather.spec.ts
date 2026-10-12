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

class RebreatherTabPage {
    constructor(private fixture: ComponentFixture<TanksComplexComponent>) { }

    public get circuitTypeBtn(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#circuitType')).nativeElement as HTMLButtonElement;
    }

    public get tanksTabBtn(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#tanksTab')).nativeElement as HTMLButtonElement;
    }

    public get rebreatherTabBtn(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#rebreatherTab')).nativeElement as HTMLButtonElement;
    }

    public get injectionRatioInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#injectionRatio')).nativeElement as HTMLInputElement;
    }

    /** Undefined, when the rebreather tab isn't shown */
    public get rebreatherOptions(): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css('app-rebreather-options'))?.nativeElement as HTMLElement | undefined;
    }

    /** Undefined, when all tanks are valid */
    public get tanksTabError(): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css('#tanksTabError'))?.nativeElement as HTMLElement | undefined;
    }

    /** Undefined, when all rebreather options are valid */
    public get rebreatherTabError(): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css('#rebreatherTabError'))?.nativeElement as HTMLElement | undefined;
    }

    public tankPressureInput(index: number): HTMLInputElement {
        return this.fixture.debugElement.query(By.css(`#pressureItem-${index}`)).nativeElement as HTMLInputElement;
    }

    public selectPscr(): void {
        this.selectCircuit(() => document.querySelector('#circuitPscr') as HTMLElement);
    }

    public selectOpenCircuit(): void {
        this.selectCircuit(() => document.querySelector('#circuitOc') as HTMLElement);
    }

    public showTanksTab(): void {
        this.click(this.tanksTabBtn);
    }

    public showRebreatherTab(): void {
        this.click(this.rebreatherTabBtn);
    }

    public typeInjectionRatio(value: string): void {
        this.type(this.injectionRatioInput, value);
    }

    public typeTankPressure(index: number, value: string): void {
        this.type(this.tankPressureInput(index), value);
    }

    private type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        this.fixture.detectChanges();
    }

    /** dropdown item is resolved only after the dropdown is opened */
    private selectCircuit(circuitItem: () => HTMLElement): void {
        this.click(this.circuitTypeBtn);
        this.click(circuitItem());
    }

    private click(element: HTMLElement): void {
        element.click();
        this.fixture.detectChanges();
    }
}

describe('Tanks Complex component - Rebreather', () => {
    let fixture: ComponentFixture<TanksComplexComponent>;
    let schedules: DiveSchedules;
    let optionsChangedSpy: jasmine.Spy<() => void>;
    let rebreatherPage: RebreatherTabPage;

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
        optionsChangedSpy = spyOn(TestBed.inject(ReloadDispatcher), 'sendOptionsChanged').and.callThrough();
        fixture = TestBed.createComponent(TanksComplexComponent);
        rebreatherPage = new RebreatherTabPage(fixture);
        fixture.detectChanges();
    });

    it('rebreather options render also in open circuit', () => {
        expect(rebreatherPage.rebreatherOptions).toBeDefined();
    });

    it('selecting pSCR switches circuit and fires options change', () => {
        rebreatherPage.selectPscr();

        expect(schedules.selectedOptions.circuit).toBe(CircuitType.pscr);
        expect(optionsChangedSpy).toHaveBeenCalledWith();
    });

    it('rebreather shows tanks and rebreather tabs', () => {
        rebreatherPage.selectPscr();

        expect(rebreatherPage.tanksTabBtn).toBeDefined();
        expect(rebreatherPage.rebreatherTabBtn).toBeDefined();
    });

    it('rebreather tab shows options', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.showRebreatherTab();

        expect(rebreatherPage.rebreatherOptions).toBeDefined();
        expect(fixture.componentInstance.rebreatherTab).toBeTrue();
    });

    it('rebreather tab is closed, when switched back to open circuit', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.showRebreatherTab();
        rebreatherPage.selectOpenCircuit();
        rebreatherPage.selectPscr();

        expect(fixture.componentInstance.rebreatherTab).toBeFalse();
    });

    it('invalid tank marks tanks tab with error', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.typeTankPressure(0, '9999');

        expect(rebreatherPage.tanksTabError).toBeDefined();
        expect(rebreatherPage.rebreatherTabError).toBeUndefined();
    });

    it('invalid rebreather value marks rebreather tab with error also after leaving the tab', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.showRebreatherTab();
        rebreatherPage.typeInjectionRatio('2');
        rebreatherPage.showTanksTab();

        expect(rebreatherPage.rebreatherTabError).toBeDefined();
        expect(rebreatherPage.tanksTabError).toBeUndefined();
        expect(fixture.componentInstance.rootForm.valid).toBeFalse();
    });

    it('fixed rebreather value removes the error', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.showRebreatherTab();
        rebreatherPage.typeInjectionRatio('2');
        rebreatherPage.typeInjectionRatio('10');

        expect(rebreatherPage.rebreatherTabError).toBeUndefined();
        expect(schedules.selectedOptions.injectionRatio).toBe(10);
    });

    it('switch to open circuit with invalid rebreather value unblocks the form', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.showRebreatherTab();
        rebreatherPage.typeInjectionRatio('2');
        rebreatherPage.selectOpenCircuit();

        expect(fixture.componentInstance.rootForm.valid).toBeTrue();
    });

    it('selecting open circuit switches back', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.selectOpenCircuit();

        expect(schedules.selectedOptions.isRebreather).toBeFalse();
    });
});
