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
import { OptionsService } from '../shared/options.service';
import { Plan } from '../shared/plan.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { TanksService } from '../shared/tanks.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { TanksSimpleComponent } from './tanks-simple.component';

export class SimpleTanksPage {
    constructor(private fixture: ComponentFixture<TanksSimpleComponent>) { }

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

describe('Tanks Simple component', () => {
    let component: TanksSimpleComponent;
    let fixture: ComponentFixture<TanksSimpleComponent>;
    let simplePage: SimpleTanksPage;
    let schedulerSpy: jasmine.Spy<() => void>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TanksSimpleComponent, GaslabelComponent,
                OxygenComponent, OxygenDropDownComponent],
            providers: [WorkersFactoryCommon, UnitConversion,
                PlannerService, InputControls,
                ValidatorGroups, DelayedScheduleService,
                DecimalPipe, TanksService, ViewSwitchService,
                OptionsService, Plan],
            imports: [ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TanksSimpleComponent);
        const plan = TestBed.inject(Plan);
        component = fixture.componentInstance;
        const firstTank = fixture.componentInstance.firstTank.tank;
        plan.setSimple(30, 12, firstTank, new Options());
        simplePage = new SimpleTanksPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        schedulerSpy = spyOn(scheduler, 'schedule')
            .and.callFake(() => { });
    });

    it('Switch to simple view rebinds first tank', () => {
        const firstTank = component.firstTank;
        firstTank.startPressure = 210;
        firstTank.size = 24;

        fixture.detectChanges();
        expect(simplePage.startPressureInput.value).toBe('210');
        expect(simplePage.sizeInput.value).toBe('24');
    });

    it('Imperial units adjusts sac', inject([UnitConversion],
        (units: UnitConversion) => {
            units.imperialUnits = true;
            const sac = component.gasSac();
            expect(sac).toBeCloseTo(19.33836, 5);
        }));

    it('Invalid change prevents calculate', () => {
        fixture.detectChanges();
        simplePage.sizeInput.value = 'aaa';
        simplePage.sizeInput.dispatchEvent(new Event('input'));
        expect(schedulerSpy).not.toHaveBeenCalled();
    });

    it('Valid change triggers calculate', () => {
        fixture.detectChanges();
        simplePage.sizeInput.value = '12';
        simplePage.sizeInput.dispatchEvent(new Event('input'));
        expect(schedulerSpy).toHaveBeenCalledTimes(1);
    });

    it('Assign best mix rebinds the control', () => {
        fixture.detectChanges();
        // can't call component.assignBestMix();, because it needs to be triggered by the dropdown
        simplePage.btnBestMix.click();
        fixture.detectChanges();
        const newO2 = simplePage.oxygenInput.value;
        expect(newO2).toBe('35');
        expect(component.firstTank.o2).toBe(35);
    });
});
