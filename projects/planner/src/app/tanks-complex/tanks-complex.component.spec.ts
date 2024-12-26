import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { TankTemplate } from 'scuba-physics';
import { GaslabelComponent } from '../controls/gaslabel/gaslabel.component';
import { OxygenDropDownComponent } from '../controls/oxygen-dropdown/oxygen-dropdown.component';
import { OxygenComponent } from '../controls/oxygen/oxygen.component';
import { TankSizeComponent } from '../controls/tank.size/tank.size.component';
import { InputControls } from '../shared/inputcontrols';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { TanksComplexComponent } from './tanks-complex.component';
import { WayPointsService } from '../shared/waypoints.service';
import { DebugElement } from '@angular/core';
import _ from 'lodash';
import { ViewStates } from '../shared/viewStates';
import { Preferences } from '../shared/preferences';
import { PreferencesStore } from '../shared/preferencesStore';
import { SubViewStorage } from '../shared/subViewStorage';
import {DiveSchedules} from '../shared/dive.schedules';
import {ReloadDispatcher} from '../shared/reloadDispatcher';

export class ComplexTanksPage {
    constructor(private fixture: ComponentFixture<TanksComplexComponent>) { }

    public sizeInput(index: number): HTMLInputElement {
        const id = `#sizeItemB-${index} input`; // we check on large display only
        return this.htmlElement(id);
    }

    public pressureInput(index: number): HTMLInputElement {
        const id = `#pressureItem-${index}`;
        return this.htmlElement(id);
    }

    public o2Input(index: number): HTMLInputElement {
        const id = `#o2Item-${index}`;
        const o2DropDown = this.debugElement(id);
        return o2DropDown.query(By.css('input')).nativeElement as HTMLInputElement;
    }

    public heInput(index: number): HTMLInputElement {
        const id = `#heItem-${index}`;
        return this.htmlElement(id);
    }

    public removeButtons(): number {
        const idPrefix = '[id^="removeTank"]';
        const found = this.fixture.debugElement.queryAll(By.css(idPrefix));
        return found.length;
    }

    public applyGasButton(index: number, text: string): HTMLLinkElement {
        const id = `#o2Item-${index}`;
        const o2Element = this.debugElement(id);

        const allButtons = o2Element.queryAll(By.css('.dropdown-item'));
        const button = _(allButtons)
            .filter(de => (<HTMLElement>de.nativeElement).innerText === text)
            .head()?.nativeElement as HTMLLinkElement;
        return button;
    }

    private htmlElement(id: string): HTMLInputElement {
        const found = this.debugElement(id);
        return found.nativeElement as HTMLInputElement;
    }
    private debugElement(id: string): DebugElement {
        const found = this.fixture.debugElement.query(By.css(id));
        return found;
    }
}

describe('Tanks Complex component', () => {
    let component: TanksComplexComponent;
    let fixture: ComponentFixture<TanksComplexComponent>;
    let complexPage: ComplexTanksPage;
    let dispatcherSpy: jasmine.Spy<() => void>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                TanksComplexComponent, GaslabelComponent,
                OxygenComponent, OxygenDropDownComponent, TankSizeComponent
            ],
            providers: [
                WorkersFactoryCommon, UnitConversion,
                PlannerService, InputControls,
                ValidatorGroups, DecimalPipe, ViewSwitchService,
                WayPointsService, SubViewStorage, ViewStates,
                Preferences, PreferencesStore, DiveSchedules,
                ReloadDispatcher
            ],
            imports: [ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TanksComplexComponent);
        component = fixture.componentInstance;
        complexPage = new ComplexTanksPage(fixture);
        const dispatcher = TestBed.inject(ReloadDispatcher);
        dispatcherSpy = spyOn(dispatcher, 'sendTankChanged')
            .and.callFake(() => { });
    });

    it('Switch to complex view rebinds all tanks', inject([DiveSchedules],
        (schedules: DiveSchedules) => {
            const tanksService = schedules.selected.tanksService;
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

        expect(dispatcherSpy).not.toHaveBeenCalled();
    });

    describe('Valid change', () => {
        beforeEach(() => {
            fixture.detectChanges();
            complexPage.sizeInput(0).value = '24';
            complexPage.sizeInput(0).dispatchEvent(new Event('input'));
        });

        it('triggers calculate', () => {
            expect(dispatcherSpy).toHaveBeenCalledTimes(1);
        });

        it('doesn\'t break working pressure', () => {
            expect(component.tanks[0].workingPressure).not.toBeNaN();
        });
    });

    it('Assign gas name tank rebinds new o2 value', () => {
        fixture.detectChanges();
        const applyEan36 = complexPage.applyGasButton(0, 'EAN36');
        applyEan36.click();
        fixture.detectChanges();
        expect(complexPage.o2Input(0).value).toBe('36');
    });

    it('Assign gas name tank rebinds new He value', () => {
        fixture.detectChanges();
        const apply1845 = complexPage.applyGasButton(0, 'Trimix 18/45');
        apply1845.click();
        fixture.detectChanges();
        expect(complexPage.heInput(0).value).toBe('45');
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
        const applyOxygen = complexPage.applyGasButton(0, 'Oxygen');
        applyOxygen.click();

        complexPage.heInput(0).value = '70';
        complexPage.heInput(0).dispatchEvent(new Event('input'));

        expect(complexPage.o2Input(0).value).toBe('30');
    });
});
