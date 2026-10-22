import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CircuitType } from 'scuba-physics';
import { EccrOptionsComponent } from './eccr-options.component';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { UnitConversion } from '../../shared/UnitConversion';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { OptionsService } from '../../shared/options.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';

class EccrOptionsPage {
    constructor(private fixture: ComponentFixture<EccrOptionsComponent>) { }

    public get descentSetpointInput(): HTMLInputElement {
        return this.input('#descentSetpoint');
    }

    public get bottomSetpointInput(): HTMLInputElement {
        return this.input('#bottomSetpoint');
    }

    public get decoSetpointInput(): HTMLInputElement {
        return this.input('#decoSetpoint');
    }

    public get switchDepthInput(): HTMLInputElement {
        return this.input('#setpointSwitchDepth');
    }

    public get loopVolumeInput(): HTMLInputElement {
        return this.input('#eccrLoopVolume');
    }

    public get metabolicO2Input(): HTMLInputElement {
        return this.input('#eccrMetabolicO2');
    }

    /** Undefined, when not rendered */
    public optional(selector: string): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css(selector))?.nativeElement as HTMLElement | undefined;
    }

    public type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        this.fixture.detectChanges();
    }

    private input(selector: string): HTMLInputElement {
        return this.fixture.debugElement.query(By.css(selector)).nativeElement as HTMLInputElement;
    }
}

describe('EccrOptionsComponent', () => {
    let fixture: ComponentFixture<EccrOptionsComponent>;
    let options: OptionsService;
    let changedSpy: jasmine.Spy<() => void>;
    let page: EccrOptionsPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, EccrOptionsComponent],
            providers: [
                InputControls, ValidatorGroups, UnitConversion, DecimalPipe,
                DiveSchedules, ReloadDispatcher, provideTestTranslate()
            ]
        }).compileComponents();

        options = TestBed.inject(DiveSchedules).selectedOptions;
        options.circuit = CircuitType.eccr;
        changedSpy = spyOn(TestBed.inject(ReloadDispatcher), 'sendOptionsChanged').and.callFake(() => { });
        fixture = TestBed.createComponent(EccrOptionsComponent);
        page = new EccrOptionsPage(fixture);
        fixture.detectChanges();
    });

    it('shows current eCCR values', () => {
        expect(page.descentSetpointInput.value).toBe('0.7');
        expect(page.bottomSetpointInput.value).toBe('1.1');
        expect(page.decoSetpointInput.value).toBe('1.3');
        expect(page.switchDepthInput.value).toBe('20');
        expect(page.loopVolumeInput.value).toBe('6');
        expect(page.metabolicO2Input.value).toBe('1');
    });

    it('has no oxygen flow nor injection ratio', () => {
        expect(page.optional('#o2Flow')).toBeUndefined();
        expect(page.optional('#injectionRatio')).toBeUndefined();
    });

    it('applies values and fires change', () => {
        page.type(page.descentSetpointInput, '0.6');
        page.type(page.bottomSetpointInput, '1.2');
        page.type(page.decoSetpointInput, '1.4');
        page.type(page.switchDepthInput, '15');
        page.type(page.loopVolumeInput, '5');
        page.type(page.metabolicO2Input, '1.5');

        expect(options.descentSetpoint).toBeCloseTo(0.6, 6);
        expect(options.bottomSetpoint).toBeCloseTo(1.2, 6);
        expect(options.decoSetpoint).toBeCloseTo(1.4, 6);
        expect(options.setpointSwitchDepth).toBeCloseTo(15, 6);
        expect(options.loopVolume).toBeCloseTo(5, 6);
        expect(options.metabolicO2).toBeCloseTo(1.5, 6);
        expect(changedSpy).toHaveBeenCalledTimes(6);
    });

    it('invalid deco setpoint is marked and not applied', () => {
        page.type(page.decoSetpointInput, '2');

        expect(page.decoSetpointInput.classList).toContain('is-invalid');
        expect(page.optional('#decoSetpointError')?.textContent).toContain(TestBed.inject(UnitConversion).ranges.setpointLabel);
        expect(options.decoSetpoint).toBeCloseTo(1.3, 6);
        expect(changedSpy).not.toHaveBeenCalled();
    });

    it('invalid switch depth is marked', () => {
        page.type(page.switchDepthInput, '40');

        expect(page.switchDepthInput.classList).toContain('is-invalid');
        expect(page.optional('#setpointSwitchDepthError')?.textContent)
            .toContain(TestBed.inject(UnitConversion).ranges.setpointSwitchDepthLabel);
    });

    it('descent setpoint higher than bottom setpoint is marked and not applied', () => {
        page.type(page.descentSetpointInput, '1.2');

        expect(page.descentSetpointInput.classList).toContain('is-invalid');
        expect(page.optional('#descentSetpointError')?.textContent).toContain('eccrOptions.descentAboveBottom');
        expect(options.descentSetpoint).toBeCloseTo(0.7, 6);
        expect(changedSpy).not.toHaveBeenCalled();
    });

    it('stores imperial switch depth in meters', () => {
        // validators are created with ranges of current units, as when the units are changed in settings
        const units = TestBed.inject(UnitConversion);
        units.imperialUnits = true;
        const imperialFixture = TestBed.createComponent(EccrOptionsComponent);
        imperialFixture.detectChanges();
        const imperialPage = new EccrOptionsPage(imperialFixture);
        imperialPage.type(imperialPage.switchDepthInput, '50');

        expect(options.getOptions().rebreather.setpointSwitchDepth).toBeCloseTo(units.toMeters(50), 6);
    });

    it('reloads values, when options are reloaded', () => {
        options.decoSetpoint = 1.5;
        TestBed.inject(ReloadDispatcher).sendOptionsReloaded(options);
        fixture.detectChanges();

        expect(page.decoSetpointInput.value).toBe('1.5');
    });

    it('reloads values, when selected dive is changed', () => {
        options.bottomSetpoint = 1.2;
        TestBed.inject(ReloadDispatcher).sendSelectedChanged(TestBed.inject(DiveSchedules).selected.id);
        fixture.detectChanges();

        expect(page.bottomSetpointInput.value).toBe('1.2');
    });

    it('removes its form from the root form when destroyed', () => {
        const rootForm: FormGroup = fixture.componentInstance.rootForm;
        expect(rootForm.get(EccrOptionsComponent.formName)).toBeTruthy();
        fixture.destroy();
        expect(rootForm.get(EccrOptionsComponent.formName)).toBeNull();
    });
});
