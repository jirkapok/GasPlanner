import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TankSizeComponent } from './tank.size.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { CommonModule, DecimalPipe, NgFor } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MdbFormsModule } from 'mdb-angular-ui-kit/forms';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

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

    it('Assign standard tank applies imperial values', () => {
        spyOn(component.applyTemplate, 'emit');
        const templateButtons = page.templateButtons[2].nativeElement as HTMLInputElement;
        templateButtons.dispatchEvent(new Event('click'));

        fixture.detectChanges();

        expect(component.tank.size).toBeCloseTo(165);
        expect(component.tank.workingPressure).toBeCloseTo(2640);
        expect(component.applyTemplate.emit).toHaveBeenCalledTimes(1);
    });
});
