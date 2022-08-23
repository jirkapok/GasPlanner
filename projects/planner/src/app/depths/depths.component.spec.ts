import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { OptionExtensions } from 'projects/scuba-physics/src/lib/Options.spec';
import { StandardGases } from 'scuba-physics';
import { GasToxicity } from '../shared/gasToxicity.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthsComponent } from './depths.component';

describe('DepthsComponent', () => {
    let component: DepthsComponent;
    let fixture: ComponentFixture<DepthsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepthsComponent],
            imports: [FormsModule],
            providers: [WorkersFactoryCommon, PlannerService, UnitConversion]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('MND for 12/35 returns 52 m', () => {
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6);
        const toxicity = new GasToxicity(options);
        const gas = StandardGases.trimix2135.copy();
        const result = toxicity.mndForGas(gas);
        expect(result).toBe(51.54);
    });

    describe('Max narcotic depth', () => {
        it('Is calculated 30 m for Air with 30m max. narcotic depth option', inject([PlannerService],
            (planner: PlannerService) => {
                component.applyMaxDepth();
                expect(planner.plan.maxDepth).toBe(30);
            }));

        it('Max narcotic depth is applied', inject([PlannerService],
            (planner: PlannerService) => {
                planner.firstTank.o2 = 50;
                component.applyMaxDepth();
                expect(planner.plan.maxDepth).toBe(18);
            }));
    });
});
