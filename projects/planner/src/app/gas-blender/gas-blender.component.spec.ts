import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { GasBlenderComponent } from './gas-blender.component';
import { UnitConversion } from '../shared/UnitConversion';
import { GasBlenderService } from '../shared/gas-blender.service';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { ApplicationSettingsService } from '../shared/ApplicationSettings';
import { BlendPricingService } from '../shared/blend-pricing.service';

describe('GasBlenderComponent', () => {
    let component: GasBlenderComponent;
    let fixture: ComponentFixture<GasBlenderComponent>;
    let calculateSpy: jasmine.Spy<() => void>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GasBlenderComponent],
            providers: [
                UnitConversion,
                GasBlenderService, BlendPricingService,
                ValidatorGroups, InputControls, DecimalPipe,
                SubViewStorage, ViewStates, PreferencesStore,
                Preferences, ViewSwitchService, DiveSchedules,
                ReloadDispatcher, ApplicationSettingsService
            ]
        });
        fixture = TestBed.createComponent(GasBlenderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        const calc = TestBed.inject(GasBlenderService);
        calculateSpy = spyOn(calc, 'calculate');
    });

    it('Apply change calls calculate', () => {
        component.applyChange();

        expect(calculateSpy).toHaveBeenCalledTimes(1);
    });

    it('Apply template calls calculate', () => {
        component.applyTemplate();

        expect(calculateSpy).toHaveBeenCalledTimes(1);
    });

    it('Toggle pricing', () => {
        component.showPricing = true;
        component.togglePricing();

        expect(component.showPricing).toBe(false);

        component.togglePricing();

        expect(component.showPricing).toBe(true);
    });
});
