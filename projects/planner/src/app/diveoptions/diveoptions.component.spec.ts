import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DiveOptionsComponent } from './diveoptions.component';

describe('DepthComponent Imperial units', () => {
    let component: DiveOptionsComponent;
    let fixture: ComponentFixture<DiveOptionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DiveOptionsComponent],
            imports: [ReactiveFormsModule],
            providers: [WorkersFactoryCommon, DecimalPipe,
                PlannerService, UnitConversion]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DiveOptionsComponent);
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        fixture.detectChanges();
    });

    it('Altitude bound to imperial', () => {
        component.options.maxEND = 30;
        expect(component.maxEND).toBeCloseTo(98.425197, 6);
    });

    it('Last stop depth bound to imperial', () => {
        component.lastStopDepth = 10;
        expect(component.options.lastStopDepth).toBeCloseTo(3.048, 6);
    });

    it('Descent speed bound to imperial', () => {
        component.descentSpeed = 10;
        expect(component.options.descentSpeed).toBeCloseTo(3.048, 6);
    });

    it('Ascent speed to 50% bound to imperial', () => {
        component.ascentSpeed50perc = 10;
        expect(component.options.ascentSpeed50perc).toBeCloseTo(3.048, 6);
    });

    it('Ascent speed 50% to 6 m bound to imperial', () => {
        component.ascentSpeed50percTo6m = 10;
        expect(component.options.ascentSpeed50percTo6m).toBeCloseTo(3.048, 6);
    });

    it('Ascent speed from 6 m bound to imperial', () => {
        component.ascentSpeed6m = 10;
        expect(component.options.ascentSpeed6m).toBeCloseTo(3.048, 6);
    });
});
