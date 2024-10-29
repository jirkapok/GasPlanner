import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DiverComponent } from './diver.component';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { DiverOptions } from '../shared/models';
import { By } from '@angular/platform-browser';
import { DecimalPipe } from '@angular/common';

class DiverPage {
    constructor(private fixture: ComponentFixture<DiverComponent>) {}

    public get stressRmvInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#stressRmv')).nativeElement as HTMLInputElement;
    }
}

describe('DiverComponent', () => {
    let component: DiverComponent;
    let fixture: ComponentFixture<DiverComponent>;
    let diverPage: DiverPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DiverComponent],
            imports: [ReactiveFormsModule],
            providers: [UnitConversion, ValidatorGroups, InputControls, DecimalPipe]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DiverComponent);
        component = fixture.componentInstance;
        component.diver = new DiverOptions();
        fixture.detectChanges();
        diverPage = new DiverPage(fixture);
    });

    // eslint-disable-next-line jasmine/no-focused-tests
    fit('should display stress RMV value in the input field', () => {
        component.diver.stressRmv = 30;
        fixture.detectChanges();

        expect(diverPage.stressRmvInput.value).toBe('30');
    });
});
