import { DecimalPipe } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { GaslabelComponent } from '../gaslabel/gaslabel.component';
import { NitroxO2Component } from '../nitrox-o2/nitrox-o2.component';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { TanksComponent } from './tanks.component';

export class SimpleTanksPage {
    constructor(private fixture: ComponentFixture<TanksComponent>) { }

    public get sizeInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#sizeFirstTank')).nativeElement as HTMLInputElement;
    }

    public get startPressureInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#startPressureFirstTank')).nativeElement as HTMLInputElement;
    }

    public get oxygenDebug(): DebugElement {
        return this.fixture.debugElement.query(By.css('#o2Nitrox'));
    }

    public get oxygenInput(): HTMLInputElement {
        return this.oxygenDebug.nativeElement as HTMLInputElement;
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

    // TODO remove the range validator, mix and max no longer needed directives
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TanksComponent, GaslabelComponent, NitroxO2Component],
            providers: [WorkersFactoryCommon, UnitConversion, PlannerService, DecimalPipe],
            imports: [ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TanksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        complexPage = new ComplexTanksPage(fixture);
        simplePage = new SimpleTanksPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        schedulerSpy = spyOn(scheduler, 'schedule')
            .and.callFake(() => {});
    });

    it('Imperial units adjusts sac', inject([UnitConversion],
        (units: UnitConversion) => {
            units.imperialUnits = true;
            const sac = component.gasSac(0);
            expect(sac).toBeCloseTo(19.33836, 5);
        }));

    it('Adds tank', inject([PlannerService],
        (planner: PlannerService) => {
            planner.isComplex = true;
            component.addTank();
            expect(component.tanks.length).toBe(2);
        }));

    it('Removes tank', inject([PlannerService],
        (planner: PlannerService) => {
            planner.isComplex = true;
            component.addTank();
            component.addTank();
            component.addTank();
            component.removeTank(3);
            expect(component.tanks.length).toBe(3);
        }));

    it('Switch to simple view rebinds first tank', inject([PlannerService],
        (planner: PlannerService) => {
            planner.isComplex = true;
            const firstTank = component.firstTank;
            firstTank.startPressure = 210;
            firstTank.size = 24;
            planner.isComplex = false;

            fixture.detectChanges();
            expect(simplePage.startPressureInput.value).toBe('210');
            expect(simplePage.sizeInput.value).toBe('24');
        }));

    it('Switch to complex view rebinds all tanks', inject([PlannerService],
        (planner: PlannerService) => {
            planner.addTank();
            const secondTank = planner.tanks[1];
            secondTank.startPressure = 150;
            secondTank.size = 20;
            secondTank.o2 = 25;
            secondTank.he = 31;

            planner.isComplex = true;
            fixture.detectChanges();
            expect(complexPage.sizeInput(1).value).toBe('20');
            expect(complexPage.pressureInput(1).value).toBe('150');
            expect(complexPage.o2Input(1).value).toBe('25');
            expect(complexPage.heInput(1).value).toBe('31');
        }));

    it('Invalid change in complex mode prevents calculate', inject([PlannerService],
        (planner: PlannerService) => {
            planner.isComplex = true;
            fixture.detectChanges();

            complexPage.sizeInput(0).value = 'aaa';
            complexPage.sizeInput(0).dispatchEvent(new Event('input'));
            expect(schedulerSpy).not.toHaveBeenCalled();
        }));

    it('Valid change in complex mode triggers calculate', inject([PlannerService],
        (planner: PlannerService) => {
            planner.isComplex = true;
            fixture.detectChanges();

            complexPage.sizeInput(0).value = '24';
            complexPage.sizeInput(0).dispatchEvent(new Event('input'));
            expect(schedulerSpy).toHaveBeenCalledTimes(1);
        }));

    it('Invalid change in simple mode prevents calculate', () => {
        simplePage.sizeInput.value = 'aaa';
        simplePage.sizeInput.dispatchEvent(new Event('input'));
        expect(schedulerSpy).not.toHaveBeenCalled();
    });

    it('Valid change in simple mode triggers calculate', () => {
        simplePage.sizeInput.value = '12';
        simplePage.sizeInput.dispatchEvent(new Event('input'));
        expect(schedulerSpy).toHaveBeenCalledTimes(1);
    });

    it('Assign gas name in complex view tank rebinds new o2 value', inject([PlannerService],
        (planner: PlannerService) => {
            planner.isComplex = true;
            component.assignStandardGas(0, 'Ean36');
            fixture.detectChanges();
            expect(complexPage.o2Input(0).value).toBe('36');
        }));
});
