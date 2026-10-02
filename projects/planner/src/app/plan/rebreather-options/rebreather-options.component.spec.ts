import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
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

describe('RebreatherOptionsComponent', () => {
    let fixture: ComponentFixture<RebreatherOptionsComponent>;
    let options: OptionsService;
    let changedSpy: jasmine.Spy<() => void>;

    const input = (id: string): HTMLInputElement => fixture.debugElement.query(By.css(id)).nativeElement as HTMLInputElement;

    const typeValue = (id: string, value: string): void => {
        const element = input(id);
        element.value = value;
        element.dispatchEvent(new Event('input'));
        fixture.detectChanges();
    };

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
        fixture.detectChanges();
    });

    it('shows current pSCR values', () => {
        expect(input('#injectionRatio').value).toBe('8');
        expect(input('#metabolicO2').value).toBe('1');
    });

    it('applies injection ratio and fires change', () => {
        typeValue('#injectionRatio', '10');
        expect(options.injectionRatio).toBe(10);
        expect(changedSpy).toHaveBeenCalledWith();
    });

    it('applies metabolic oxygen', () => {
        typeValue('#metabolicO2', '1.5');
        expect(options.metabolicO2).toBeCloseTo(1.5, 6);
    });

    it('invalid value is marked and not applied', () => {
        typeValue('#injectionRatio', '50');
        expect(input('#injectionRatio').classList).toContain('is-invalid');
        expect(options.injectionRatio).toBe(8);
        expect(changedSpy).not.toHaveBeenCalled();
    });
});
