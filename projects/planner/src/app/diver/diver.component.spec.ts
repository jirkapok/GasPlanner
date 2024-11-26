import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DiverComponent } from './diver.component';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { DecimalPipe } from '@angular/common';
import { DiverOptions } from '../shared/models';
import { PpO2Component } from '../pp-o2/pp-o2.component';

class DiverPage {
    constructor(private componentFixture: ComponentFixture<DiverComponent>) {}

    public get rmvInput(): HTMLInputElement {
        return this.componentFixture.debugElement.query(By.css('#rmv')).nativeElement as HTMLInputElement;
    }

    public get stressRmvInput(): HTMLInputElement {
        return this.componentFixture.debugElement.query(By.css('#stressRmv')).nativeElement as HTMLInputElement;
    }

    public get maxPpO2Input(): HTMLInputElement {
        return this.componentFixture.debugElement.query(By.css('#maxPO2')).nativeElement as HTMLInputElement;
    }

    public get maxDecoPpO2Input(): HTMLInputElement {
        return this.componentFixture.debugElement.query(By.css('#maxDecoPO2')).nativeElement as HTMLInputElement;
    }
}

describe('DiverComponent', () => {
    let component: DiverComponent;
    let fixture: ComponentFixture<DiverComponent>;
    let unitConversion: UnitConversion;
    let simplePage: DiverPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DiverComponent, PpO2Component],
            imports: [ReactiveFormsModule],
            providers: [
                UnitConversion,
                ValidatorGroups,
                InputControls,
                DecimalPipe
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DiverComponent);
        component = fixture.componentInstance;
        unitConversion = TestBed.inject(UnitConversion);
        component.diver = new DiverOptions();
        fixture.detectChanges();
        simplePage = new DiverPage(fixture);
    });

    it('should change rmv and stressRmv values and emit', () => {
        simplePage.rmvInput.value = '15';
        simplePage.rmvInput.dispatchEvent(new Event('input'));

        simplePage.stressRmvInput.value = '25';
        simplePage.stressRmvInput.dispatchEvent(new Event('input'));

        fixture.detectChanges();

        expect(simplePage.rmvInput.value).toBe('15');
        expect(simplePage.stressRmvInput.value).toBe('25');
    });

    it('should change maxPpO2', () => {
        simplePage.maxPpO2Input.value = '1.2';
        simplePage.maxPpO2Input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(simplePage.maxPpO2Input.value).toBe('1.2');
    });

    it('should change maxDecoPpO2', () => {
        simplePage.maxDecoPpO2Input.value = '1.4';
        simplePage.maxDecoPpO2Input.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(simplePage.maxDecoPpO2Input.value).toBe('1.4');
    });

    xit('should change rmvStep when switching to imperial units', () => {
        expect(component.rmvStep).toBe(0.1);
        unitConversion.imperialUnits = true;
        fixture.detectChanges();
        expect(component.rmvStep).toBe(0.001);
    });
});
