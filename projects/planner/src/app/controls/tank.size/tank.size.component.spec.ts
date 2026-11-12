import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TankSizeComponent } from './tank.size.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { CommonModule, DecimalPipe, NgFor } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Precision, Tank } from 'scuba-physics';
import { TankBound } from '../../shared/models';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { renderOnPush } from '../../../testing/onPush.testing';

export class TankSizePage {
    constructor(private fixture: ComponentFixture<TankSizeComponent>) { }

    public get sizeInput(): HTMLInputElement {
        const debugSizeElement = this.fixture.debugElement.query(By.css('input'));
        return debugSizeElement.nativeElement as HTMLInputElement;
    }

    public get templateButtons(): DebugElement[] {
        const dropButton = this.fixture.debugElement.query(By.css('.dropdown-toggle'));
        dropButton.nativeElement.click();
        return this.fixture.debugElement.queryAll(By.css('li'));
    }
}

describe('TankSizeComponent', () => {
    let component: TankSizeComponent;
    let fixture: ComponentFixture<TankSizeComponent>;
    let page: TankSizePage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                UnitConversion, UnitConversion, InputControls,
                DecimalPipe, ValidatorGroups, provideNoopAnimations()
            ],
            imports: [
                CommonModule, ReactiveFormsModule,
                MdbFormsModule, MdbDropdownModule, NgFor
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TankSizeComponent);
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        page = new TankSizePage(fixture);
        fixture.detectChanges();
    });

    it('Changing size applies the value', () => {
        vi.spyOn(component.sizeChange, 'emit').mockImplementation(() => {});
        const sizeField = page.sizeInput;
        sizeField.value = '12';
        sizeField.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.sizeChange.emit).toHaveBeenCalledTimes(1);
    });

    it('Prevents update of invalid value', () => {
        vi.spyOn(component.sizeChange, 'emit').mockImplementation(() => {});
        const sizeField = page.sizeInput;
        sizeField.value = '0';
        sizeField.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.sizeChange.emit).not.toHaveBeenCalled();
    });

    it('Assign standard tank applies imperial values', () => {
        vi.spyOn(component.applyTemplate, 'emit').mockImplementation(() => {});
        const templateButtons = page.templateButtons[2].nativeElement as HTMLInputElement;
        templateButtons.dispatchEvent(new Event('click'));

        fixture.detectChanges();

        expect(component.tank.size).toBeCloseTo(165);
        expect(component.tank.workingPressure).toBeCloseTo(2640);
        expect(component.applyTemplate.emit).toHaveBeenCalledTimes(1);
    });
});

describe('TankSizeComponent OnPush', () => {
    it('renders invalid state after parent patched form outside Angular events', async () => {
        TestBed.configureTestingModule({
            providers: [UnitConversion, InputControls, DecimalPipe, ValidatorGroups, provideNoopAnimations()],
            imports: [CommonModule, ReactiveFormsModule, MdbFormsModule, MdbDropdownModule, NgFor]
        });
        const fixture = await renderOnPush(TankSizeComponent);
        const control = fixture.componentInstance.sizeForm.get('tankSize');

        control?.markAsDirty();
        control?.setValue(-1000);
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).querySelector('.is-invalid')).not.toBeNull();
    });
});

describe('TankSizeComponent units switch', () => {
    // The component has no normalization of its own, the parent writes the size of the shared tank into the control
    it('renders tank size after units switched', async () => {
        const units = new UnitConversion();
        TestBed.configureTestingModule({
            providers: [{ provide: UnitConversion, useValue: units }, InputControls, DecimalPipe, ValidatorGroups, provideNoopAnimations()],
            imports: [CommonModule, ReactiveFormsModule, MdbFormsModule, MdbDropdownModule, NgFor]
        });
        const tank = new TankBound(Tank.createDefault(), units);
        tank.sizeLiters = 15;
        const sizeForm = new FormGroup({});
        const fixture = await renderOnPush(TankSizeComponent, { tank, sizeForm });
        const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
        expect(Number(input.value)).toBe(15);

        units.imperialUnits = true;
        tank.workingPressureBars = units.toBar(units.defaults.tanks.primary.workingPressure); // as the normalization does
        sizeForm.patchValue({ tankSize: Precision.round(tank.size, 1) });
        await fixture.whenStable();

        const expected = Precision.round(units.fromTankLiters(15, tank.workingPressureBars), 1);
        expect(expected).toBeGreaterThan(15);
        expect(Number(input.value)).toBe(expected);
    });
});
