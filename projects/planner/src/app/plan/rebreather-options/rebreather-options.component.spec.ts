import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CircuitType } from 'scuba-physics';
import { RebreatherOptionsComponent } from './rebreather-options.component';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { UnitConversion } from '../../shared/UnitConversion';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { OptionsService } from '../../shared/options.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';

class RebreatherOptionsPage {
    constructor(private fixture: ComponentFixture<RebreatherOptionsComponent>) { }

    public get injectionRatioInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#injectionRatio')).nativeElement as HTMLInputElement;
    }

    public get metabolicO2Input(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#metabolicO2')).nativeElement as HTMLInputElement;
    }

    public typeInjectionRatio(value: string): void {
        this.type(this.injectionRatioInput, value);
    }

    public typeMetabolicO2(value: string): void {
        this.type(this.metabolicO2Input, value);
    }

    private type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        this.fixture.detectChanges();
    }
}

describe('RebreatherOptionsComponent', () => {
    let fixture: ComponentFixture<RebreatherOptionsComponent>;
    let options: OptionsService;
    let changedSpy: jasmine.Spy<() => void>;
    let optionsPage: RebreatherOptionsPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule, RebreatherOptionsComponent],
            providers: [
                InputControls, ValidatorGroups, UnitConversion, DecimalPipe,
                DiveSchedules, ReloadDispatcher, provideTestTranslate()
            ]
        }).compileComponents();

        options = TestBed.inject(DiveSchedules).selectedOptions;
        options.circuit = CircuitType.pscr;
        changedSpy = spyOn(TestBed.inject(ReloadDispatcher), 'sendOptionsChanged').and.callFake(() => { });
        fixture = TestBed.createComponent(RebreatherOptionsComponent);
        optionsPage = new RebreatherOptionsPage(fixture);
        fixture.detectChanges();
    });

    it('shows current pSCR values', () => {
        expect(optionsPage.injectionRatioInput.value).toBe('8');
        expect(optionsPage.metabolicO2Input.value).toBe('1');
    });

    it('applies injection ratio and fires change', () => {
        optionsPage.typeInjectionRatio('10');
        expect(options.injectionRatio).toBe(10);
        expect(changedSpy).toHaveBeenCalledWith();
    });

    it('applies metabolic oxygen', () => {
        optionsPage.typeMetabolicO2('1.5');
        expect(options.metabolicO2).toBeCloseTo(1.5, 6);
    });

    it('valid value is not applied, when other planner field is invalid', () => {
        // e.g. invalid tank in the same planner form
        const invalidTank = new FormControl<number | null>(null, (control) => Validators.required(control));
        fixture.componentInstance.rootForm.addControl('tanks', invalidTank);
        optionsPage.typeInjectionRatio('10');

        expect(options.injectionRatio).toBe(8);
        expect(changedSpy).not.toHaveBeenCalled();
    });

    it('invalid value is marked and not applied', () => {
        optionsPage.typeInjectionRatio('50');
        expect(optionsPage.injectionRatioInput.classList).toContain('is-invalid');
        expect(options.injectionRatio).toBe(8);
        expect(changedSpy).not.toHaveBeenCalled();
    });
});
