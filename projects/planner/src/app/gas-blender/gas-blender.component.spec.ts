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
import { By } from '@angular/platform-browser';

export class GasBlenderPage {
    constructor(private fixture: ComponentFixture<GasBlenderComponent>) { }

    public get pricingToggleBtn(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#pricingToggle')).nativeElement as HTMLInputElement;
    }

    public get unitPriceInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#unitPrice')).nativeElement as HTMLInputElement;
    }

    public get totalPriceDisplay(): HTMLElement {
        return this.fixture.debugElement.query(By.css('#totalPrice')).nativeElement as HTMLElement;
    }
}
describe('GasBlenderComponent', () => {
    let component: GasBlenderComponent;
    let fixture: ComponentFixture<GasBlenderComponent>;
    let calculateSpy: jasmine.Spy<() => void>;
    let simplePage: GasBlenderPage;
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
        simplePage = new GasBlenderPage(fixture);
    });

    it('should toggle pricing and display total price', () => {

        expect(simplePage.pricingToggleBtn.checked).toBeFalsy();

        simplePage.pricingToggleBtn.click();
        fixture.detectChanges();

        const pricingElement = simplePage.totalPriceDisplay;
        expect(pricingElement).toBeTruthy();

        simplePage.unitPriceInput.value = '50';
        simplePage.unitPriceInput.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(simplePage.totalPriceDisplay.textContent).toBe('50');
    });

    it('Apply change calls calculate', () => {
        component.applyChange();

        expect(calculateSpy).toHaveBeenCalledTimes(1);
    });

    it('Apply template calls calculate', () => {
        component.applyTemplate();

        expect(calculateSpy).toHaveBeenCalledTimes(1);
    });
});
