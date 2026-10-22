import { MockInstance } from 'vitest';
import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CircuitType, StandardGases, Tank } from 'scuba-physics';
import { CardHeaderComponent } from '../../card-header/card-header.component';
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
import { TanksService } from '../../shared/tanks.service';
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
        return this.fixture.debugElement.query(By.css('app-pscr-options'))?.nativeElement as HTMLElement | undefined;
    }

    /** Undefined, when all tanks are valid */
    public get tanksTabError(): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css('#tanksTabError'))?.nativeElement as HTMLElement | undefined;
    }

    /** Undefined, when all rebreather options are valid */
    public get rebreatherTabError(): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css('#rebreatherTabError'))?.nativeElement as HTMLElement | undefined;
    }

    /** Undefined, when not rendered */
    public get mccrOptions(): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css('app-mccr-options'))?.nativeElement as HTMLElement | undefined;
    }

    /** Undefined, when not rendered */
    public get eccrOptions(): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css('app-eccr-options'))?.nativeElement as HTMLElement | undefined;
    }

    public get helpDocument(): string {
        const header = this.fixture.debugElement.query(By.directive(CardHeaderComponent));
        return (header.componentInstance as CardHeaderComponent).helpDocument;
    }

    public tankPressureInput(index: number): HTMLInputElement {
        return this.fixture.debugElement.query(By.css(`#pressureItem-${index}`)).nativeElement as HTMLInputElement;
    }

    public tankRole(index: number): string {
        return this.text(`#tankRole-${index}`);
    }

    /** Small devices accordion item header */
    public tankRoleSmall(index: number): string {
        const items = this.fixture.debugElement.queryAll(By.css('mdb-accordion-item .accordion-button'));
        const header = items[index]?.nativeElement as HTMLElement | undefined;
        return header?.textContent?.trim() ?? '';
    }

    public tankO2Input(index: number): HTMLInputElement {
        return this.fixture.debugElement.query(By.css(`#o2Item-${index} input`)).nativeElement as HTMLInputElement;
    }

    public tankO2Menu(index: number): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css(`#o2Item-${index} #o2Menu`)).nativeElement as HTMLButtonElement;
    }

    public tankHeInput(index: number): HTMLInputElement {
        return this.fixture.debugElement.query(By.css(`#heItem-${index}`)).nativeElement as HTMLInputElement;
    }

    /** Undefined, when the tank can't be removed */
    public removeTankBtn(index: number): HTMLButtonElement | undefined {
        return this.fixture.debugElement.query(By.css(`#removeTank-${index}`))?.nativeElement as HTMLButtonElement | undefined;
    }

    public selectMccr(): void {
        this.selectCircuit(() => document.querySelector('#circuitMccr') as HTMLElement);
    }

    public selectEccr(): void {
        this.selectCircuit(() => document.querySelector('#circuitEccr') as HTMLElement);
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

    public typeSetpoint(value: string): void {
        const input = this.fixture.debugElement.query(By.css('#setpoint')).nativeElement as HTMLInputElement;
        this.type(input, value);
    }

    public typeTankPressure(index: number, value: string): void {
        this.type(this.tankPressureInput(index), value);
    }

    public type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        this.fixture.detectChanges();
    }

    /** dropdown item is resolved only after the dropdown is opened */
    private selectCircuit(circuitItem: () => HTMLElement): void {
        this.click(this.circuitTypeBtn);
        this.click(circuitItem());
    }

    private text(selector: string): string {
        const element = this.fixture.debugElement.query(By.css(selector))?.nativeElement as HTMLElement | undefined;
        return element?.textContent?.trim() ?? '';
    }

    private click(element: HTMLElement): void {
        element.click();
        this.fixture.detectChanges();
    }
}

describe('Tanks Complex component - Rebreather', () => {
    let fixture: ComponentFixture<TanksComplexComponent>;
    let schedules: DiveSchedules;
    let optionsChangedSpy: MockInstance<() => void>;
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
        optionsChangedSpy = vi.spyOn(TestBed.inject(ReloadDispatcher), 'sendOptionsChanged');
        fixture = TestBed.createComponent(TanksComplexComponent);
        rebreatherPage = new RebreatherTabPage(fixture);
        fixture.detectChanges();
    });

    it('rebreather options render also in open circuit', () => {
        expect(rebreatherPage.rebreatherOptions).toBeDefined();
        expect(rebreatherPage.mccrOptions).toBeDefined();
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
        expect(fixture.componentInstance.rebreatherTab).toBe(true);
    });

    it('rebreather tab is closed, when switched back to open circuit', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.showRebreatherTab();
        rebreatherPage.selectOpenCircuit();
        rebreatherPage.selectPscr();

        expect(fixture.componentInstance.rebreatherTab).toBe(false);
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
        expect(fixture.componentInstance.rootForm.valid).toBe(false);
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

        expect(fixture.componentInstance.rootForm.valid).toBe(true);
    });

    describe('Invalid values prevent recalculation', () => {
        it('switch to pSCR with invalid tank', () => {
            rebreatherPage.typeTankPressure(0, '9999');
            optionsChangedSpy.mockClear();
            rebreatherPage.selectPscr();

            expect(optionsChangedSpy).not.toHaveBeenCalled();
        });

        it('switch to open circuit with invalid tank', () => {
            rebreatherPage.selectPscr();
            rebreatherPage.typeTankPressure(0, '9999');
            optionsChangedSpy.mockClear();
            rebreatherPage.selectOpenCircuit();

            expect(optionsChangedSpy).not.toHaveBeenCalled();
        });

        it('tank template applied with invalid rebreather value', () => {
            const tankChangedSpy = vi.spyOn(TestBed.inject(ReloadDispatcher), 'sendTankChanged').mockImplementation(() => {});
            rebreatherPage.selectPscr();
            rebreatherPage.showRebreatherTab();
            rebreatherPage.typeInjectionRatio('2');
            fixture.componentInstance.assignTankTemplate(0, { name: '12 L', size: 12, workingPressure: 0 });

            expect(tankChangedSpy).not.toHaveBeenCalled();
        });

        it('switch to open circuit with only invalid rebreather value recalculates, because it is reset', () => {
            rebreatherPage.selectPscr();
            rebreatherPage.showRebreatherTab();
            rebreatherPage.typeInjectionRatio('2');
            optionsChangedSpy.mockClear();
            rebreatherPage.selectOpenCircuit();

            expect(optionsChangedSpy).toHaveBeenCalledWith();
        });
    });

    describe('mCCR', () => {
        const tanks = (): TanksService => schedules.selectedTanks;

        beforeEach(() => {
            tanks().loadFrom([new Tank(12, 200, 21), new Tank(11, 200, 50), new Tank(11, 200, 21)]);
            fixture.detectChanges();
            rebreatherPage.selectMccr();
        });

        it('switches circuit and inserts oxygen as second tank', () => {
            expect(schedules.selectedOptions.circuit).toBe(CircuitType.mccr);
            expect(tanks().tanks.length).toBe(4);
            expect(tanks().oxygenTank?.tank.gas.compositionEquals(StandardGases.oxygen)).toBe(true);
            expect(optionsChangedSpy).toHaveBeenCalledWith();
        });

        it('header shows mCCR', () => {
            expect(rebreatherPage.circuitTypeBtn.textContent).toContain('tanksComplex.mccr');
        });

        it('rebreather tab shows only mCCR options', () => {
            rebreatherPage.showRebreatherTab();
            expect(rebreatherPage.mccrOptions?.hidden).toBe(false);
            expect(rebreatherPage.rebreatherOptions?.hidden).toBe(true);
        });

        it('pSCR shows only pSCR options', () => {
            rebreatherPage.selectPscr();
            expect(rebreatherPage.rebreatherOptions?.hidden).toBe(false);
            expect(rebreatherPage.mccrOptions?.hidden).toBe(true);
        });

        it('invalid pSCR value doesn\'t block the planner after switch to mCCR', () => {
            rebreatherPage.selectPscr();
            rebreatherPage.showRebreatherTab();
            rebreatherPage.typeInjectionRatio('2');
            rebreatherPage.selectMccr();
            expect(fixture.componentInstance.rootForm.valid).toBe(true);
        });

        it('invalid mCCR value doesn\'t block the planner after switch to pSCR', () => {
            rebreatherPage.showRebreatherTab();
            rebreatherPage.typeSetpoint('2');
            rebreatherPage.selectPscr();
            expect(fixture.componentInstance.rootForm.valid).toBe(true);
            expect(schedules.selectedOptions.setpoint).toBeCloseTo(1.3, 6);
        });

        it('invalid mCCR value marks rebreather tab with error also after leaving the tab', () => {
            rebreatherPage.showRebreatherTab();
            rebreatherPage.typeSetpoint('2');
            rebreatherPage.showTanksTab();
            expect(rebreatherPage.rebreatherTabError).toBeDefined();
        });

        it('switch to open circuit with invalid mCCR value unblocks the form', () => {
            rebreatherPage.showRebreatherTab();
            rebreatherPage.typeSetpoint('2');
            rebreatherPage.selectOpenCircuit();
            expect(fixture.componentInstance.rootForm.valid).toBe(true);
        });

        it('labels diluent and oxygen tanks in both layouts', () => {
            expect(rebreatherPage.tankRole(0)).toBe('tanksComplex.diluent');
            expect(rebreatherPage.tankRole(1)).toBe('tanksComplex.oxygen');
            expect(rebreatherPage.tankRole(2)).toBe('');
            expect(rebreatherPage.tankRoleSmall(0)).toContain('tanksComplex.diluent');
            expect(rebreatherPage.tankRoleSmall(1)).toContain('tanksComplex.oxygen');
        });

        it('oxygen gas can\'t be changed', () => {
            expect(rebreatherPage.tankO2Input(1).disabled).toBe(true);
            expect(rebreatherPage.tankO2Menu(1).disabled).toBe(true);
            expect(rebreatherPage.tankHeInput(1).disabled).toBe(true);
            expect(rebreatherPage.tankO2Input(0).disabled).toBe(false);
        });

        it('oxygen tank pressure change keeps the oxygen', () => {
            rebreatherPage.typeTankPressure(1, '150');
            const oxygen = tanks().tanks[1];
            expect(oxygen.startPressure).toBe(150);
            expect(oxygen.o2).toBe(100);
            expect(oxygen.he).toBe(0);
        });

        it('diluent and oxygen can\'t be removed', () => {
            expect(rebreatherPage.removeTankBtn(1)).toBeUndefined();
            expect(rebreatherPage.removeTankBtn(2)).toBeDefined();
        });

        it('switch back to open circuit keeps tanks order and enables oxygen gas', () => {
            const order = tanks().tanks;
            rebreatherPage.selectOpenCircuit();
            expect(tanks().tanks).toEqual(order);
            expect(rebreatherPage.tankO2Input(1).disabled).toBe(false);
            expect(rebreatherPage.removeTankBtn(1)).toBeDefined();
        });

        it('help opens rebreather document on rebreather tab', () => {
            expect(rebreatherPage.helpDocument).toBe('tanks');
            rebreatherPage.showRebreatherTab();
            expect(rebreatherPage.helpDocument).toBe('rebreather');
        });
    });

    describe('eCCR', () => {
        const tanks = (): TanksService => schedules.selectedTanks;

        beforeEach(() => {
            tanks().loadFrom([new Tank(12, 200, 21), new Tank(11, 200, 50), new Tank(11, 200, 21)]);
            fixture.detectChanges();
            rebreatherPage.selectEccr();
        });

        it('eCCR switches circuit and inserts oxygen as second tank', () => {
            expect(schedules.selectedOptions.circuit).toBe(CircuitType.eccr);
            expect(tanks().tanks.length).toBe(4);
            expect(tanks().oxygenTank?.tank.gas.compositionEquals(StandardGases.oxygen)).toBeTrue();
            expect(optionsChangedSpy).toHaveBeenCalledWith();
        });

        it('header shows eCCR', () => {
            expect(rebreatherPage.circuitTypeBtn.textContent).toContain('tanksComplex.eccr');
        });

        it('rebreather tab shows only eCCR options', () => {
            rebreatherPage.showRebreatherTab();
            expect(rebreatherPage.eccrOptions?.hidden).toBeFalse();
            expect(rebreatherPage.mccrOptions?.hidden).toBeTrue();
            expect(rebreatherPage.rebreatherOptions?.hidden).toBeTrue();
        });

        it('invalid mCCR value doesn\'t block the planner after switch to eCCR', () => {
            rebreatherPage.selectMccr();
            rebreatherPage.showRebreatherTab();
            rebreatherPage.typeSetpoint('2');
            rebreatherPage.selectEccr();
            expect(fixture.componentInstance.rootForm.valid).toBeTrue();
        });

        it('invalid eCCR value marks rebreather tab with error', () => {
            rebreatherPage.showRebreatherTab();
            const input = fixture.debugElement.query(By.css('#decoSetpoint')).nativeElement as HTMLInputElement;
            rebreatherPage.type(input, '2');
            rebreatherPage.showTanksTab();
            expect(rebreatherPage.rebreatherTabError).toBeDefined();
        });

        it('labels diluent and oxygen tanks', () => {
            expect(rebreatherPage.tankRole(0)).toBe('tanksComplex.diluent');
            expect(rebreatherPage.tankRole(1)).toBe('tanksComplex.oxygen');
        });

        it('eCCR oxygen gas can\'t be changed', () => {
            expect(rebreatherPage.tankO2Input(1).disabled).toBeTrue();
            expect(rebreatherPage.tankHeInput(1).disabled).toBeTrue();
        });

        it('eCCR diluent and oxygen can\'t be removed', () => {
            expect(rebreatherPage.removeTankBtn(1)).toBeUndefined();
            expect(rebreatherPage.removeTankBtn(2)).toBeDefined();
        });
    });

    it('selecting open circuit switches back', () => {
        rebreatherPage.selectPscr();
        rebreatherPage.selectOpenCircuit();

        expect(schedules.selectedOptions.isRebreather).toBe(false);
    });
});
