import { ComponentFixture, TestBed, inject } from '@angular/core/testing';

import { TankSizeComponent } from './tank.size.component';
import { UnitConversion } from '../shared/UnitConversion';
import { InputControls } from '../shared/inputcontrols';
import { DecimalPipe } from '@angular/common';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

export class TankSizePage {
    constructor(private fixture: ComponentFixture<TankSizeComponent>) { }

    public get sizeInput(): HTMLInputElement {
        const debugSizeElement = this.fixture.debugElement.query(By.css('input'));
        return debugSizeElement.nativeElement as HTMLInputElement;
    }

    public get templateButtons(): DebugElement[] {
        return this.fixture.debugElement.queryAll(By.css('li'));
    }
}

describe('TankSizeComponent', () => {
    let component: TankSizeComponent;
    let fixture: ComponentFixture<TankSizeComponent>;
    let page: TankSizePage;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TankSizeComponent],
            providers: [UnitConversion, InputControls, DecimalPipe, ValidatorGroups]
        });
        const units = TestBed.inject(UnitConversion);
        units.imperialUnits = true;
        fixture = TestBed.createComponent(TankSizeComponent);
        component = fixture.componentInstance;
        page = new TankSizePage(fixture);
    });

    it('Changing size applies the value', () => {
        fixture.detectChanges();
        spyOn(component.sizeChange, 'emit');
        const sizeField = page.sizeInput;
        sizeField.value = '12';
        sizeField.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.sizeChange.emit).toHaveBeenCalledTimes(1);
    });

    it('Prevents update of invalid value', () => {
        spyOn(component.sizeChange, 'emit');
        const sizeField = page.sizeInput;
        sizeField.value = '0';
        sizeField.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.sizeChange.emit).not.toHaveBeenCalled();
    });

    it('Assign standard tank applies impoerial values', () => {
        fixture.detectChanges();
        spyOn(component.sizeChange, 'emit');
        const templateButtons = page.templateButtons[2].nativeElement as HTMLInputElement;
        templateButtons.dispatchEvent(new Event('click'));

        fixture.detectChanges();

        expect(component.tank.size).toBeCloseTo(165);
        expect(component.tank.workingPressure).toBeCloseTo(2640);
        expect(component.sizeChange.emit).toHaveBeenCalledTimes(1);
    });
});
