import { DecimalPipe } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DepthsService } from '../shared/depths.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthComponent } from './depth.component';

export class DepthPage {
    constructor(private fixture: ComponentFixture<DepthComponent>) {}

    public get depthInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#depthField')).nativeElement as HTMLInputElement;
    }

    public get applyMaxDepthButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#applyMaxDepthBtn')).nativeElement as HTMLButtonElement;
    }
}

describe('DepthComponent Imperial units', () => {
    let component: DepthComponent;
    let fixture: ComponentFixture<DepthComponent>;
    let planner: PlannerService;
    let depths: DepthsService;
    let page: DepthPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepthComponent],
            imports: [ReactiveFormsModule],
            providers: [FormBuilder, DecimalPipe,
                WorkersFactoryCommon, PlannerService, UnitConversion]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthComponent);
        page = new DepthPage(fixture);
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        depths = component.depths;
        planner = TestBed.inject(PlannerService);
        fixture.detectChanges();
        page.depthInput.value = '70';
        page.depthInput.dispatchEvent(new Event('input'));
    });

    it('Converts bound depth to imperial', () => {
        expect(depths.plannedDepth).toBeCloseTo(70, 6);
    });

    it('Depth to imperial', () => {
        const depth = planner.plan.maxDepth;
        expect(depth).toBeCloseTo(21.336, 6);
    });

    it('Apply max depth', () => {
        page.applyMaxDepthButton.click();
        expect(page.depthInput.value).toBe('98.4');
    });
});
