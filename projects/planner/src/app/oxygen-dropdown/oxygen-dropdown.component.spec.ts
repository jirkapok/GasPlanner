import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { InputControls } from '../shared/inputcontrols';
import { OptionsService } from '../shared/options.service';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { OxygenDropDownComponent } from './oxygen-dropdown.component';

export class OxygenDropDownPage {
    constructor(private fixture: ComponentFixture<OxygenDropDownComponent>) { }

    public get oxygenInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    }
}

describe('Oxygen DropDown component', () => {
    let component: OxygenDropDownComponent;
    let fixture: ComponentFixture<OxygenDropDownComponent>;
    let page: OxygenDropDownPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [OxygenDropDownComponent],
            providers: [UnitConversion,
                InputControls, DecimalPipe,
                ValidatorGroups, OptionsService
            ],
            imports: [RouterTestingModule.withRoutes([]), ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(OxygenDropDownComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        page = new OxygenDropDownPage(fixture);
    });

    describe('Standard gases', () => {
        describe('Trixmix', () => {
            beforeEach(() => {
                fixture.detectChanges();
                component.showTrimixGases = true;
            });

            it('Shows all gases', () => {
                expect(component.standardGases.length).toEqual(13);
            });

            it('Shows extended range for oxygen content', () => {
                expect(component.o2Ranges).toEqual([1, 100]);
            });

            it('Shows trimix oxygen range label', () => {
                expect(component.o2RangeLabel).toEqual('1 - 100 %');
            });
        });

        describe('Nitrox', () => {
            beforeEach(() => {
                fixture.detectChanges();
                component.showTrimixGases = false;
            });

            it('Shows only nitrox gases', () => {
                expect(component.standardGases.length).toEqual(6);
            });

            it('Shows extended range for nitrox oxygen content', () => {
                expect(component.o2Ranges).toEqual([21, 100]);
            });

            it('Shows nitrox oxygen range label', () => {
                expect(component.o2RangeLabel).toEqual('21 - 100 %');
            });
        });
    });

    describe('Apply Standard gas', () => {
        beforeEach(() => {
            fixture.detectChanges();
            spyOn(component.standardGasApplied, 'emit');
            component.assignStandardGas('Oxygen');
        });

        it('Aplies template', () => {
            expect(component.tank.o2).toEqual(100);
        });

        it('Fires event', () => {
            expect(component.standardGasApplied.emit).toHaveBeenCalledOnceWith('Oxygen');
        });
    });
});
