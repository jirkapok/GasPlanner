import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthComponent } from './depth.component';

describe('DepthComponent Imperial units', () => {
    let component: DepthComponent;
    let fixture: ComponentFixture<DepthComponent>;

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
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        fixture.detectChanges();
    });

    it('Converts bound depth to imperial', () => {
        expect(component.boundDepth).toBeCloseTo(98.425197, 6);
    });

    it('Depth to imperial', () => {
        component.depthForm.patchValue({
            depth: 70
        });
        component.depthChanged();
        expect(component.depth).toBeCloseTo(21.336, 6);
    });
});
