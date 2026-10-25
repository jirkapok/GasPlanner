import { MockInstance } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CircuitType } from 'scuba-physics';
import { MccrOptionsComponent } from './mccr-options.component';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { UnitConversion } from '../../shared/UnitConversion';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { OptionsService } from '../../shared/options.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';

class MccrOptionsPage {
    constructor(private fixture: ComponentFixture<MccrOptionsComponent>) { }

    public get setpointInput(): HTMLInputElement {
        return this.input('#setpoint');
    }

    public get o2FlowInput(): HTMLInputElement {
        return this.input('#o2Flow');
    }

    public get loopVolumeInput(): HTMLInputElement {
        return this.input('#loopVolume');
    }

    public get metabolicO2Input(): HTMLInputElement {
        return this.input('#metabolicO2');
    }

    /** Undefined, when not rendered */
    public get injectionRatioInput(): HTMLInputElement | undefined {
        return this.fixture.debugElement.query(By.css('#injectionRatio'))?.nativeElement as HTMLInputElement | undefined;
    }

    public get setpointLabel(): string {
        const label = this.fixture.debugElement.query(By.css('label[for="setpoint"]')).nativeElement as HTMLElement;
        return label.textContent ?? '';
    }

    /** Undefined, when the value is valid */
    public get setpointError(): HTMLElement | undefined {
        return this.fixture.debugElement.query(By.css('#setpointError'))?.nativeElement as HTMLElement | undefined;
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

describe('MccrOptionsComponent', () => {
    let fixture: ComponentFixture<MccrOptionsComponent>;
    let options: OptionsService;
    let changedSpy: MockInstance<() => void>;
    let page: MccrOptionsPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, MccrOptionsComponent],
            providers: [
                InputControls, ValidatorGroups, UnitConversion, DecimalPipe,
                DiveSchedules, ReloadDispatcher, provideTestTranslate()
            ]
        }).compileComponents();

        options = TestBed.inject(DiveSchedules).selectedOptions;
        options.circuit = CircuitType.mccr;
        changedSpy = vi.spyOn(TestBed.inject(ReloadDispatcher), 'sendOptionsChanged').mockImplementation(() => { });
        fixture = TestBed.createComponent(MccrOptionsComponent);
        page = new MccrOptionsPage(fixture);
        fixture.detectChanges();
    });

    it('shows current mCCR values', () => {
        expect(page.setpointInput.value).toBe('1.3');
        expect(page.o2FlowInput.value).toBe('0.8');
        expect(page.loopVolumeInput.value).toBe('6');
        expect(page.metabolicO2Input.value).toBe('1');
    });

    it('shows setpoint as target ppO2', () => {
        expect(page.setpointLabel).toContain('mccrOptions.setpoint');
    });

    it('has no injection ratio', () => {
        expect(page.injectionRatioInput).toBeUndefined();
    });

    it('applies values and fires change', () => {
        page.type(page.setpointInput, '1.2');
        page.type(page.o2FlowInput, '1.1');
        page.type(page.loopVolumeInput, '5');
        page.type(page.metabolicO2Input, '1.5');

        expect(options.setpoint).toBeCloseTo(1.2, 6);
        expect(options.o2Flow).toBeCloseTo(1.1, 6);
        expect(options.loopVolume).toBeCloseTo(5, 6);
        expect(options.metabolicO2).toBeCloseTo(1.5, 6);
        expect(changedSpy).toHaveBeenCalledTimes(4);
    });

    it('invalid target ppO2 is marked and not applied', () => {
        page.type(page.setpointInput, '2');

        expect(page.setpointInput.classList).toContain('is-invalid');
        expect(page.setpointError?.textContent).toContain(TestBed.inject(UnitConversion).ranges.setpointLabel);
        expect(options.setpoint).toBeCloseTo(1.3, 6);
        expect(changedSpy).not.toHaveBeenCalled();
    });

    it('invalid oxygen flow is marked', () => {
        page.type(page.o2FlowInput, '0.1');
        expect(page.o2FlowInput.classList).toContain('is-invalid');
    });

    it('invalid loop volume is marked', () => {
        page.type(page.loopVolumeInput, '20');
        expect(page.loopVolumeInput.classList).toContain('is-invalid');
    });

    it('stores imperial volumes in liters', () => {
        // validators are created with ranges of current units, as when the units are changed in settings
        const units = TestBed.inject(UnitConversion);
        units.imperialUnits = true;
        const imperialFixture = TestBed.createComponent(MccrOptionsComponent);
        imperialFixture.detectChanges();
        new MccrOptionsPage(imperialFixture).type(new MccrOptionsPage(imperialFixture).o2FlowInput, '0.04');

        expect(options.getOptions().rebreather.o2Flow).toBeCloseTo(units.toLiter(0.04), 6);
    });

    it('imperial volumes use finer step', () => {
        TestBed.inject(UnitConversion).imperialUnits = true;
        fixture.detectChanges();

        expect(page.o2FlowInput.step).toBe('0.001');
        expect(page.loopVolumeInput.step).toBe('0.001');
        expect(page.metabolicO2Input.step).toBe('0.001');
    });

    it('reloads values, when options are reloaded', () => {
        options.setpoint = 1.1;
        TestBed.inject(ReloadDispatcher).sendOptionsReloaded(options);
        fixture.detectChanges();

        expect(page.setpointInput.value).toBe('1.1');
    });

    it('removes its form from the root form when destroyed', () => {
        const rootForm: FormGroup = fixture.componentInstance.rootForm;
        expect(rootForm.get(MccrOptionsComponent.formName)).toBeTruthy();
        fixture.destroy();
        expect(rootForm.get(MccrOptionsComponent.formName)).toBeNull();
    });
});
