import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { InputControls } from '../shared/inputcontrols';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { DepthComponent } from './depth.component';

export class DepthPage {
    constructor(private fixture: ComponentFixture<DepthComponent>) { }

    public get depthInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#depthField')).nativeElement as HTMLInputElement;
    }

    public get applyMaxDepthButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#applyMaxDepthBtn')).nativeElement as HTMLButtonElement;
    }
}

describe('DepthComponent', () => {
    let component: DepthComponent;
    let fixture: ComponentFixture<DepthComponent>;
    let page: DepthPage;
    let changeFired: boolean;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepthComponent],
            imports: [ReactiveFormsModule],
            providers: [
                UnitConversion, ValidatorGroups,
                InputControls, DecimalPipe
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthComponent);
        page = new DepthPage(fixture);
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        fixture.detectChanges();
    });

    it('Fires value changed', () => {
        component.depthChange.subscribe(() => changeFired = true);
        changeFired = false;
        page.depthInput.value = '70';
        page.depthInput.dispatchEvent(new Event('input'));
        expect(changeFired).toBeTruthy();
    });

    it('Fires apply max depth', () => {
        let eventFired = false;
        component.assignMaxDepth.subscribe(() => eventFired = true);
        page.applyMaxDepthButton.click();
        expect(eventFired).toBeTruthy();
    });
});
