import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { FormsModule, NgModel } from '@angular/forms';
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
            declarations: [TanksComponent, NgModel, GaslabelComponent, RangeValidator],
            providers: [WorkersFactoryCommon, UnitConversion, PlannerService],
            imports: [FormsModule]
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
            const sac = component.gasSac(planner.firstTank);
            expect(sac).toBeCloseTo(19.33836, 5);
        }));
});
