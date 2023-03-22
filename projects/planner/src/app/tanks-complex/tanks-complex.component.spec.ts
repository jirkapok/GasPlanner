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
import { TanksComplexComponent } from './tanks-complex.component';

export class ComplexTanksPage {
    constructor(private fixture: ComponentFixture<TanksComplexComponent>) { }

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

describe('Tanks Complex component', () => {
    let component: TanksComplexComponent;
    let fixture: ComponentFixture<TanksComplexComponent>;
    let complexPage: ComplexTanksPage;
    let schedulerSpy: jasmine.Spy<() => void>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TanksComplexComponent, GaslabelComponent,
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
        fixture = TestBed.createComponent(TanksComplexComponent);
        const plan = TestBed.inject(Plan);
        component = fixture.componentInstance;
        const tanksService = TestBed.inject(TanksService);
        const firstTank = tanksService.firstTank.tank;
        plan.setSimple(30,12, firstTank, new Options());
        fixture.detectChanges();
        complexPage = new ComplexTanksPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        schedulerSpy = spyOn(scheduler, 'schedule')
            .and.callFake(() => { });
    });

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
