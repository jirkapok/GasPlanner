import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { GaslabelComponent } from '../gaslabel/gaslabel.component';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { RangeValidator } from '../validators/range/directive';
import { TanksComponent } from './tanks.component';

describe('Tanks component', () => {
    let component: TanksComponent;
    let fixture: ComponentFixture<TanksComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TanksComponent, GaslabelComponent, RangeValidator],
            providers: [WorkersFactoryCommon, UnitConversion, PlannerService, DecimalPipe],
            imports: [ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TanksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Imperial units adjusts sac', inject([PlannerService, UnitConversion],
        (planner: PlannerService, units: UnitConversion) => {
            units.imperialUnits = true;
            const sac = component.gasSac(0);
            expect(sac).toBeCloseTo(19.33836, 5);
        }));

    it('Adds tank', inject([PlannerService],
        (planner: PlannerService) => {
            planner.isComplex = true;
            component.addTank();
            expect(component.tanks.length).toBe(2);
        }));

    it('Removes tank', inject([PlannerService],
        (planner: PlannerService) => {
            planner.isComplex = true;
            component.addTank();
            component.addTank();
            component.addTank();
            component.removeTank(3);
            expect(component.tanks.length).toBe(3);
        }));
});
