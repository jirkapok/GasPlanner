import { DecimalPipe } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Options } from 'scuba-physics';
import { GaslabelComponent } from '../gaslabel/gaslabel.component';
import { OxygenDropDownComponent } from '../oxygen-dropdown/oxygen-dropdown.component';
import { OxygenComponent } from '../oxygen/oxygen.component';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { InputControls } from '../shared/inputcontrols';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';
import { Plan } from '../shared/plan.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { TanksService } from '../shared/tanks.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { TanksComponent } from './tanks-simple.component';

export class SimpleTanksPage {
    constructor(private fixture: ComponentFixture<TanksComponent>) { }

    public get sizeInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#sizeFirstTank')).nativeElement as HTMLInputElement;
    }

    public get startPressureInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#startPressureFirstTank')).nativeElement as HTMLInputElement;
    }

    public get oxygenDebug(): DebugElement {
        return this.fixture.debugElement.query(By.css('#fO2'));
    }

    public get oxygenInput(): HTMLInputElement {
        return this.oxygenDebug.nativeElement as HTMLInputElement;
    }

    public get btnBestMix(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#btnBestMix')).nativeElement as HTMLInputElement;
    }
}

export class ComplexTanksPage {
    constructor(private fixture: ComponentFixture<TanksComponent>) { }

    public get sizeDebugs(): DebugElement[] {
        const all = this.fixture.debugElement.queryAll(By.css('#sizeItem'));
        return all;
    }

    public sizeInput(index: number): HTMLInputElement {
        return this.sizeDebugs[index].nativeElement as HTMLInputElement;
    }

    public pressureInput(index: number): HTMLInputElement {
        const all = this.fixture.debugElement.queryAll(By.css('#pressureItem'));
        return all[index].nativeElement as HTMLInputElement;
    }

    public o2Input(index: number): HTMLInputElement {
        const all = this.fixture.debugElement.queryAll(By.css('#o2Item'));
        return all[index].nativeElement as HTMLInputElement;
    }

    public heInput(index: number): HTMLInputElement {
        const all = this.fixture.debugElement.queryAll(By.css('#heItem'));
        return all[index].nativeElement as HTMLInputElement;
    }
}

describe('Tanks component', () => {
    let component: TanksComponent;
    let fixture: ComponentFixture<TanksComponent>;
    let complexPage: ComplexTanksPage;
    let simplePage: SimpleTanksPage;
    let schedulerSpy: jasmine.Spy<() => void>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TanksComponent, GaslabelComponent,
                OxygenComponent, OxygenDropDownComponent],
            providers: [WorkersFactoryCommon, UnitConversion,
                PlannerService, InputControls,
                ValidatorGroups, DelayedScheduleService,
                DecimalPipe, TanksService, ViewSwitchService,
                OptionsDispatcherService, Plan],
            imports: [ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TanksComponent);
        const plan = TestBed.inject(Plan);
        component = fixture.componentInstance;
        const firstTank = fixture.componentInstance.firstTank.tank;
        plan.setSimple(30,12, firstTank, new Options());
        fixture.detectChanges();
        complexPage = new ComplexTanksPage(fixture);
        simplePage = new SimpleTanksPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        schedulerSpy = spyOn(scheduler, 'schedule')
            .and.callFake(() => { });
    });

    it('Switch to simple view rebinds first tank', inject([ViewSwitchService],
        (viewSwitch: ViewSwitchService) => {
            viewSwitch.isComplex = true;
            const firstTank = component.firstTank;
            firstTank.startPressure = 210;
            firstTank.size = 24;
            viewSwitch.isComplex = false;

            fixture.detectChanges();
            expect(simplePage.startPressureInput.value).toBe('210');
            expect(simplePage.sizeInput.value).toBe('24');
        }));

    it('Switch to complex view rebinds all tanks', inject([ViewSwitchService, TanksService],
        (viewSwitch: ViewSwitchService, tanksService: TanksService) => {
            tanksService.addTank();
            const secondTank = tanksService.tanks[1];
            secondTank.startPressure = 150;
            secondTank.size = 20;
            secondTank.o2 = 25;
            secondTank.he = 31;

            viewSwitch.isComplex = true;
            fixture.detectChanges();
            expect(complexPage.sizeInput(1).value).toBe('20');
            expect(complexPage.pressureInput(1).value).toBe('150');
            expect(complexPage.o2Input(1).value).toBe('25');
            expect(complexPage.heInput(1).value).toBe('31');
        }));

    describe('Simple view', () => {
        it('Imperial units adjusts sac', inject([UnitConversion],
            (units: UnitConversion) => {
                units.imperialUnits = true;
                const sac = component.gasSac(0);
                expect(sac).toBeCloseTo(19.33836, 5);
            }));

        it('Invalid change prevents calculate', () => {
            simplePage.sizeInput.value = 'aaa';
            simplePage.sizeInput.dispatchEvent(new Event('input'));
            expect(schedulerSpy).not.toHaveBeenCalled();
        });

        it('Valid change triggers calculate', () => {
            simplePage.sizeInput.value = '12';
            simplePage.sizeInput.dispatchEvent(new Event('input'));
            expect(schedulerSpy).toHaveBeenCalledTimes(1);
        });

        it('Simple view Assign best mix rebinds the control', () => {
            // can't call component.assignBestMix();, because it needs to be triggered by the dropdown
            simplePage.btnBestMix.click();
            fixture.detectChanges();
            const newO2 = simplePage.oxygenInput.value;
            expect(newO2).toBe('35');
            expect(component.firstTank.o2).toBe(35);
        });
    });

    describe('Complex view', () => {
        it('Adds tank', inject([ViewSwitchService],
            (viewSwitch: ViewSwitchService) => {
                viewSwitch.isComplex = true;
                component.addTank();
                expect(component.tanks.length).toBe(2);
            }));

        it('Removes tank', inject([ViewSwitchService],
            (viewSwitch: ViewSwitchService) => {
                viewSwitch.isComplex = true;
                component.addTank();
                component.addTank();
                component.addTank();
                component.removeTank(3);
                expect(component.tanks.length).toBe(3);
            }));

        it('Invalid change in complex mode prevents calculate', inject([ViewSwitchService],
            (viewSwitch: ViewSwitchService) => {
                viewSwitch.isComplex = true;
                fixture.detectChanges();

                complexPage.sizeInput(0).value = 'aaa';
                complexPage.sizeInput(0).dispatchEvent(new Event('input'));
                expect(schedulerSpy).not.toHaveBeenCalled();
            }));

        it('Valid change triggers planner calculate', inject([ViewSwitchService],
            (viewSwitch: ViewSwitchService) => {
                viewSwitch.isComplex = true;
                fixture.detectChanges();

                complexPage.sizeInput(0).value = '24';
                complexPage.sizeInput(0).dispatchEvent(new Event('input'));
                expect(schedulerSpy).toHaveBeenCalledTimes(1);
            }));

        it('Assign gas name tank rebinds new o2 value', inject([ViewSwitchService],
            (viewSwitch: ViewSwitchService) => {
                viewSwitch.isComplex = true;
                component.assignStandardGas(0, 'Ean36');
                fixture.detectChanges();
                expect(complexPage.o2Input(0).value).toBe('36');
            }));

        it('He field affects O2 field tank is reloaded', inject([ViewSwitchService],
            (viewSwitch: ViewSwitchService) => {
                viewSwitch.isComplex = true;
                component.assignStandardGas(0, 'Oxygen');
                fixture.detectChanges();
                complexPage.heInput(0).value = '70';
                complexPage.heInput(0).dispatchEvent(new Event('input'));

                expect(complexPage.o2Input(0).value).toBe('30');
            }));
    });
});
