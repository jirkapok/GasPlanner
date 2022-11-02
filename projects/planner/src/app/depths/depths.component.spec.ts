import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { OptionExtensions } from 'projects/scuba-physics/src/lib/Options.spec';
import { StandardGases, Tank } from 'scuba-physics';
import { DepthsService } from '../shared/depths.service';
import { GasToxicity } from '../shared/gasToxicity.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthsComponent } from './depths.component';

describe('DepthsComponent', () => {
    let component: DepthsComponent;
    let depths: DepthsService;
    let fixture: ComponentFixture<DepthsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepthsComponent],
            imports: [ReactiveFormsModule],
            providers: [WorkersFactoryCommon, PlannerService,
                UnitConversion, DecimalPipe]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthsComponent);
        component = fixture.componentInstance;
        depths = component.depths;
        fixture.detectChanges();
    });

    it('MND for 12/35 returns 52 m', () => {
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6);
        const toxicity = new GasToxicity(options);
        const gas = StandardGases.trimix2135.copy();
        const result = toxicity.mndForGas(gas);
        expect(result).toBe(51.54);
    });

    // TODO test cases:
    // - planDuration kicks of the calculation
    // - max ndl, max. duration and switch to simple kicks of plannedDuration reload
    // - Add level kicks calculation and adds levels and to the data
    // - remove level removes data and removes control
    // - all changes aren't possible if form is invalid

    describe('Max narcotic depth', () => {
        it('Is calculated 30 m for Air with 30m max. narcotic depth option', inject([PlannerService],
            (planner: PlannerService) => {
                depths.applyMaxDepth();
                expect(planner.plan.maxDepth).toBe(30);
            }));

        it('Max narcotic depth is applied', inject([PlannerService],
            (planner: PlannerService) => {
                planner.firstTank.o2 = 50;
                depths.applyMaxDepth();
                expect(planner.plan.maxDepth).toBe(18);
            }));
    });

    describe('Imperial Units', () => {
        beforeEach(() => {
            component.units.imperialUnits = true;
        });

        it('Updates end depth', () => {
            const last = depths.levels[1];
            last.endDepth = 70;
            const result = last.segment.endDepth;
            expect(result).toBeCloseTo(21.336, 6);
        });

        it('Converts start depth', () => {
            const last = depths.levels[1];
            last.segment.startDepth = 6.096;
            expect(last.startDepth).toBeCloseTo(20, 6);
        });

        it('Adjusts tank label', () => {
            const last = depths.levels[1];
            const tank: Tank = last.tank || new Tank(0, 0, 0);
            tank.startPressure = component.units.toBar(3000);
            tank.size = component.units.toTankLiters(100);
            expect(last.tankLabel).toBe('1. Air/100/3000');
        });
    });
});
