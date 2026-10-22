import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { GasBlenderComponent } from './gas-blender.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { GasBlenderService } from '../../shared/gas-blender.service';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { InputControls } from '../../shared/inputcontrols';
import { SubViewStorage } from '../../shared/subViewStorage';
import { ViewStates } from '../../shared/viewStates';
import { PreferencesStore } from '../../shared/preferencesStore';
import { Preferences } from '../../shared/preferences';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';
import { BlendPricingService } from '../../shared/blend-pricing.service';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { LanguageService } from '../../shared/language.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { BlenderMode, BlenderViewState } from '../../shared/views.model';
import { KnownViews } from '../../shared/viewStates';
import { GasBlender } from 'scuba-physics';

class GasBlenderPage {
    constructor(private fixture: ComponentFixture<GasBlenderComponent>) { }

    public get pricingToggleBtn(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#pricingToggle')).nativeElement as HTMLInputElement;
    }

    public get o2unitPriceInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#o2UnitPrice')).nativeElement as HTMLInputElement;
    }

    public get heUnitPriceInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#heUnitPrice')).nativeElement as HTMLInputElement;
    }

    public get topMixUnitPriceInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#topMixUnitPrice')).nativeElement as HTMLInputElement;
    }

    public get totalPriceDisplay(): HTMLElement {
        return this.fixture.debugElement.query(By.css('#totalPrice')).nativeElement as HTMLElement;
    }

    public get blendModeBtn(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#blendModeBtn')).nativeElement as HTMLButtonElement;
    }

    public get identifyModeBtn(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#identifyModeBtn')).nativeElement as HTMLButtonElement;
    }

    public get targetPressureInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#targetPressure')).nativeElement as HTMLInputElement;
    }

    public get targetPressureLabel(): HTMLElement {
        return this.fixture.debugElement.query(By.css('label[for="targetPressure"]')).nativeElement as HTMLElement;
    }

    public query(selector: string): HTMLElement | null {
        const found = this.fixture.debugElement.query(By.css(selector));
        return found ? found.nativeElement as HTMLElement : null;
    }

    public input(selector: string): HTMLInputElement {
        return this.query(selector) as HTMLInputElement;
    }
}
describe('GasBlenderComponent', () => {
    let component: GasBlenderComponent;
    let fixture: ComponentFixture<GasBlenderComponent>;
    let calculateSpy: jasmine.Spy<() => void>;
    let simplePage: GasBlenderPage;
    beforeEach(async() => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, GasBlenderComponent],
            providers: [
                UnitConversion,
                GasBlenderService, BlendPricingService,
                ValidatorGroups, InputControls, DecimalPipe,
                SubViewStorage, ViewStates, PreferencesStore,
                Preferences, ViewSwitchService, DiveSchedules,
                ReloadDispatcher, ApplicationSettingsService,
                MdbModalService, LanguageService, provideTestTranslate()
            ]
        }).compileComponents();
    });

    beforeEach(() => {
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

        simplePage.o2unitPriceInput.value = '50';
        simplePage.o2unitPriceInput.dispatchEvent(new Event('input'));

        simplePage.heUnitPriceInput.value = '75';
        simplePage.heUnitPriceInput.dispatchEvent(new Event('input'));

        simplePage.topMixUnitPriceInput.value = '100';
        simplePage.topMixUnitPriceInput.dispatchEvent(new Event('input'));

        fixture.detectChanges();
        expect(simplePage.totalPriceDisplay.textContent).toBe('20,000');
    });

    it('Apply change calls calculate', () => {
        component.applyChange();

        expect(calculateSpy).toHaveBeenCalledTimes(1);
    });

    it('Apply template calls calculate', () => {
        component.applyTemplate();

        expect(calculateSpy).toHaveBeenCalledTimes(1);
    });

    describe('Identify mix mode', () => {
        let calc: GasBlenderService;

        const switchToIdentify = () => {
            simplePage.identifyModeBtn.click();
            fixture.detectChanges();
        };

        beforeEach(() => {
            calc = TestBed.inject(GasBlenderService);
            calculateSpy.and.callThrough();
        });

        it('Starts in blend mode with editable target mix', () => {
            expect(calc.mode).toEqual(BlenderMode.blend);
            expect(simplePage.query('#resultO2')).toBeNull();
            expect(simplePage.query('#targetHe')).not.toBeNull();
            expect(simplePage.targetPressureLabel.textContent).toContain('gasBlender.pressureLabel');
        });

        it('Toggle switches to identify mode', () => {
            switchToIdentify();

            expect(calc.mode).toEqual(BlenderMode.identify);
            expect(simplePage.identifyModeBtn.classList).toContain('btn-primary');
            expect(simplePage.blendModeBtn.classList).not.toContain('btn-primary');
        });

        it('Toggle back to blend mode restores editable target mix', () => {
            switchToIdentify();
            simplePage.blendModeBtn.click();
            fixture.detectChanges();

            expect(calc.mode).toEqual(BlenderMode.blend);
            expect(simplePage.query('#targetHe')).not.toBeNull();
            expect(simplePage.query('#resultO2')).toBeNull();
        });

        it('Shows identified mix as read only outputs', () => {
            switchToIdentify();

            const resultO2 = simplePage.input('#resultO2');
            const resultHe = simplePage.input('#resultHe');
            expect(resultO2.readOnly).toBeTruthy();
            expect(resultHe.readOnly).toBeTruthy();
            expect(simplePage.query('#targetHe')).toBeNull();
            // default state: empty source topped by EAN32 to 200 bar
            expect(Number(resultO2.value)).toBeCloseTo(32, 1);
            expect(Number(resultHe.value)).toBeCloseTo(0, 1);
        });

        it('Labels target pressure as final pressure', () => {
            switchToIdentify();

            expect(simplePage.targetPressureLabel.textContent).toContain('gasBlender.finalPressureLabel');
        });

        it('Shows resulting mix and added pressure in results', () => {
            switchToIdentify();

            expect(simplePage.query('#resultN2')?.textContent).toContain('68');
            expect(simplePage.query('#addedPressure')?.textContent).toContain('200');
            expect(simplePage.query('#addO2Result')).toBeNull();
        });

        it('Final pressure below source pressure is invalid', () => {
            switchToIdentify();
            const sourcePressure = simplePage.input('#sourcePressure');
            sourcePressure.value = '100';
            sourcePressure.dispatchEvent(new Event('input'));
            simplePage.targetPressureInput.value = '50';
            simplePage.targetPressureInput.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(simplePage.targetPressureInput.classList).toContain('is-invalid');
            expect(simplePage.query('#finalPressureBelowSource')).not.toBeNull();
        });

        it('Blend mode does not validate final pressure against source', () => {
            const sourcePressure = simplePage.input('#sourcePressure');
            sourcePressure.value = '100';
            sourcePressure.dispatchEvent(new Event('input'));
            simplePage.targetPressureInput.value = '50';
            simplePage.targetPressureInput.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(simplePage.targetPressureInput.classList).not.toContain('is-invalid');
            expect(simplePage.query('#finalPressureBelowSource')).toBeNull();
        });

        it('Identify failure not caused by final pressure shows generic message', () => {
            spyOn(GasBlender, 'identify').and.throwError('Source mix contains invalid N2 content.');
            switchToIdentify();

            expect(calc.finalPressureBelowSource).toBeFalsy();
            const alert = simplePage.query('.alert-danger');
            expect(alert?.textContent).toContain('gasBlender.unableToCalculateMessage');
            expect(alert?.textContent).not.toContain('gasBlender.finalPressureBelowSourceMessage');
        });

        it('Identify failure caused by final pressure shows final pressure message', () => {
            const sourcePressure = simplePage.input('#sourcePressure');
            sourcePressure.value = '100';
            sourcePressure.dispatchEvent(new Event('input'));
            simplePage.targetPressureInput.value = '50';
            simplePage.targetPressureInput.dispatchEvent(new Event('input'));
            switchToIdentify();

            const alert = simplePage.query('.alert-danger');
            expect(alert?.textContent).toContain('gasBlender.finalPressureBelowSourceMessage');
            expect(alert?.textContent).not.toContain('gasBlender.unableToCalculateMessage');
        });

        it('Persists selected mode', () => {
            switchToIdentify();

            const views = TestBed.inject(SubViewStorage);
            const state = views.loadView<BlenderViewState>(KnownViews.blender);
            expect(state?.mode).toEqual(BlenderMode.identify);
        });
    });
});

describe('GasBlenderComponent restore mode', () => {
    const createWithState = (mode?: BlenderMode): GasBlenderComponent => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, GasBlenderComponent],
            providers: [
                UnitConversion,
                GasBlenderService, BlendPricingService,
                ValidatorGroups, InputControls, DecimalPipe,
                SubViewStorage, ViewStates, PreferencesStore,
                Preferences, ViewSwitchService, DiveSchedules,
                ReloadDispatcher, ApplicationSettingsService,
                MdbModalService, LanguageService, provideTestTranslate()
            ]
        });

        const state: BlenderViewState = {
            id: KnownViews.blender,
            source: { o2: 21, he: 0, pressure: 50 },
            target: { o2: 32, he: 0, pressure: 200 },
            topMix: { o2: 32, he: 0 },
            prices: { o2UnitPrice: 0, heUnitPrice: 0, topMixUnitPrice: 0 }
        };

        if (mode) {
            state.mode = mode;
        }

        TestBed.inject(ViewStates).set(state);
        // previous mode must not leak, when loading state
        TestBed.inject(GasBlenderService).mode = mode === BlenderMode.identify ? BlenderMode.blend : BlenderMode.identify;
        const fixture = TestBed.createComponent(GasBlenderComponent);
        fixture.detectChanges();
        return fixture.componentInstance;
    };

    it('Restores identify mode', () => {
        const component = createWithState(BlenderMode.identify);

        expect(component.calc.mode).toEqual(BlenderMode.identify);
    });

    it('Old state without mode defaults to blend', () => {
        const component = createWithState();

        expect(component.calc.mode).toEqual(BlenderMode.blend);
    });
});
