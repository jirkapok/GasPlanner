import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
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
            imports: [FormsModule],
            providers: [WorkersFactoryCommon, PlannerService, UnitConversion]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DiveOptionsComponent);
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        fixture.detectChanges();
    });

    // TODO test cases:
    // - Last stop depth
    // - Speeds

    it('Altitude bound to imperial', () => {
        component.options.maxEND = 30;
        expect(component.maxEND).toBeCloseTo(98.425197, 6);
    });

    it('Last stop depth bound to imperial', () => {
        component.lastStopDepth = 10;
        expect(component.options.lastStopDepth).toBeCloseTo(3.048, 6);
    });
});
