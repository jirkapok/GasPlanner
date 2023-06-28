import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TankTemplate, Options } from 'scuba-physics';
import { GaslabelComponent } from '../gaslabel/gaslabel.component';
import { OxygenDropDownComponent } from '../oxygen-dropdown/oxygen-dropdown.component';
import { OxygenComponent } from '../oxygen/oxygen.component';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { InputControls } from '../shared/inputcontrols';
import { OptionsService } from '../shared/options.service';
import { Plan } from '../shared/plan.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { TanksService } from '../shared/tanks.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { TanksComplexComponent } from './tanks-complex.component';
import { WayPointsService } from '../shared/waypoints.service';

export class ComplexTanksPage {
    constructor(private fixture: ComponentFixture<TanksComplexComponent>) { }

    public debugElement(id: string): HTMLInputElement {
        const found = this.fixture.debugElement.query(By.css(id));
        return found.nativeElement as HTMLInputElement;
    }

    public sizeInput(index: number): HTMLInputElement {
        const id = `#sizeItem-${index}`;
        return this.debugElement(id);
    }

    public pressureInput(index: number): HTMLInputElement {
        const id = `#pressureItem-${index}`;
        return this.debugElement(id);
    }

    public o2Input(index: number): HTMLInputElement {
        const id = `#o2Item-${index}`;
        return this.debugElement(id);
    }

    public heInput(index: number): HTMLInputElement {
        const id = `#heItem-${index}`;
        return this.debugElement(id);
    }

    public removeButtons(): number {
        const idPrefix = '[id^="removeTank"]';
        const found = this.fixture.debugElement.queryAll(By.css(idPrefix));
        return found.length;
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
                OptionsService, Plan, WayPointsService
            ],
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
        plan.setSimple(30, 12, firstTank, new Options());
        complexPage = new ComplexTanksPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        schedulerSpy = spyOn(scheduler, 'schedule')
            .and.callFake(() => { });
    });

    it('Switch to complex view rebinds all tanks', inject([TanksService],
        (tanksService: TanksService) => {
            tanksService.addTank();
            const secondTank = tanksService.tanks[1];
            secondTank.startPressure = 150;
            secondTank.size = 20;
            secondTank.o2 = 25;
            secondTank.he = 31;
            fixture.detectChanges();
            expect(complexPage.sizeInput(1).value).toBe('20');
            expect(complexPage.pressureInput(1).value).toBe('150');
            expect(complexPage.o2Input(1).value).toBe('25');
            expect(complexPage.heInput(1).value).toBe('31');
        }));

    it('Adds tank', () => {
        fixture.detectChanges();
        component.addTank();
        fixture.detectChanges();
        expect(component.tanks.length).toBe(2);
        expect(complexPage.removeButtons()).toBe(1);
    });

    it('Removes tank', () => {
        fixture.detectChanges();
        component.addTank();
        component.addTank();
        component.addTank();
        component.removeTank(3);
        fixture.detectChanges();

        expect(component.tanks.length).toBe(3);
        expect(complexPage.removeButtons()).toBe(2);
    });

    it('Invalid change in complex mode prevents calculate', () => {
        fixture.detectChanges();
        complexPage.sizeInput(0).value = 'aaa';
        complexPage.sizeInput(0).dispatchEvent(new Event('input'));

        expect(schedulerSpy).not.toHaveBeenCalled();
    });

    it('Valid change triggers planner calculate', () => {
        fixture.detectChanges();
        complexPage.sizeInput(0).value = '24';
        complexPage.sizeInput(0).dispatchEvent(new Event('input'));

        expect(schedulerSpy).toHaveBeenCalledTimes(1);
    });

    it('Assign gas name tank rebinds new o2 value', () => {
        fixture.detectChanges();
        component.assignStandardGas(0, 'Ean36');
        fixture.detectChanges();
        expect(complexPage.o2Input(0).value).toBe('36');
    });

    it('Assign tank template rebinds new size and working pressure', () => {
        fixture.detectChanges();

        const template: TankTemplate = {
            name: 'irrelevant',
            size: 30,
            workingPressure: 100
        };
        component.assignTankTemplate(0, template);
        fixture.detectChanges();
        expect(complexPage.sizeInput(0).value).toBe('30');
    });

    it('He field affects O2 field tank is reloaded', () => {
        fixture.detectChanges();
        component.assignStandardGas(0, 'Oxygen');
        complexPage.heInput(0).value = '70';
        complexPage.heInput(0).dispatchEvent(new Event('input'));

        expect(complexPage.o2Input(0).value).toBe('30');
    });
});
