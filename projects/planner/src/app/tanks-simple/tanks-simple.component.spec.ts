import { DecimalPipe } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { GaslabelComponent } from '../gaslabel/gaslabel.component';
import { OxygenDropDownComponent } from '../oxygen-dropdown/oxygen-dropdown.component';
import { OxygenComponent } from '../oxygen/oxygen.component';
import { InputControls } from '../shared/inputcontrols';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { TanksSimpleComponent } from './tanks-simple.component';
import { WayPointsService } from '../shared/waypoints.service';
import { TankSizeComponent } from '../tank.size/tank.size.component';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { Preferences } from '../shared/preferences';
import { PreferencesStore } from '../shared/preferencesStore';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';

export class SimpleTanksPage {
    constructor(private fixture: ComponentFixture<TanksSimpleComponent>) { }

    public get sizeInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#tankSize')).nativeElement as HTMLInputElement;
    }

    public get startPressureInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#startPressureFirstTank')).nativeElement as HTMLInputElement;
    }

    public get oxygenDebug(): DebugElement {
        return this.fixture.debugElement.query(By.css('#gasO2'));
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
    let dispatcherSpy: jasmine.Spy<() => void>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TanksSimpleComponent, GaslabelComponent,
                OxygenComponent, OxygenDropDownComponent, TankSizeComponent],
            providers: [
                WorkersFactoryCommon, UnitConversion,
                PlannerService, InputControls, DiveSchedules,
                ValidatorGroups, PreferencesStore, Preferences,
                DecimalPipe, ViewSwitchService, WayPointsService,
                SubViewStorage, ViewStates, ReloadDispatcher
            ],
            imports: [ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TanksSimpleComponent);
        component = fixture.componentInstance;
        simplePage = new SimpleTanksPage(fixture);
        const dispatcher = TestBed.inject(ReloadDispatcher);
        dispatcherSpy = spyOn(dispatcher, 'sendTankChanged')
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

    it('Invalid change prevents calculate', () => {
        fixture.detectChanges();
        simplePage.sizeInput.value = 'aaa';
        simplePage.sizeInput.dispatchEvent(new Event('input'));
        expect(dispatcherSpy).not.toHaveBeenCalled();
    });

    describe('Valid change', () => {
        beforeEach(() => {
            fixture.detectChanges();
            simplePage.sizeInput.value = '12';
            simplePage.sizeInput.dispatchEvent(new Event('input'));
        });

        it('triggers calculate', () => {
            expect(dispatcherSpy).toHaveBeenCalledTimes(1);
        });

        it('doesn\'t break working pressure', () => {
            expect(component.firstTank.workingPressure).not.toBeNaN();
        });
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

    describe('Imperial units', () => {
        it('adjusts sac', inject([UnitConversion],
            (units: UnitConversion) => {
                units.imperialUnits = true;
                const sac = component.gasSac();
                expect(sac).toBeCloseTo(19.33836, 5);
            }));
    });
});
