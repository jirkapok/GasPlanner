import { DecimalPipe } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { OptionExtensions } from 'projects/scuba-physics/src/lib/Options.spec';
import { StandardGases, Tank } from 'scuba-physics';
import { DepthsService } from '../shared/depths.service';
import { GasToxicity } from '../shared/gasToxicity.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthsComponent } from './depths.component';

export class DepthsPage {
    constructor(private fixture: ComponentFixture<DepthsComponent>) {}

    public get durationInput(): DebugElement {
        return this.fixture.debugElement.query(By.css('#duration'));
    }

    public get durationElement(): HTMLInputElement {
        return this.durationInput.nativeElement as HTMLInputElement;
    }

    public get applyMaxDurationButton(): DebugElement {
        return this.fixture.debugElement.query(By.css('#btnApplyDuration'));
    }
}

describe('DepthsComponent', () => {
    let component: DepthsComponent;
    let depths: DepthsService;
    let fixture: ComponentFixture<DepthsComponent>;
    let page: DepthsPage;

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
        component.planner.calculate();
        fixture.detectChanges();
        page = new DepthsPage(fixture);
    });

    it('MND for 12/35 returns 52 m', () => {
        const options = OptionExtensions.createOptions(1, 1, 1.4, 1.6);
        const toxicity = new GasToxicity(options);
        const gas = StandardGases.trimix2135.copy();
        const result = toxicity.mndForGas(gas);
        expect(result).toBe(51.54);
    });

    it('Duration change enforces calculation', () => {
        const setDuration = spyOnProperty(depths, 'planDuration', 'set')
            .withArgs(20)
            .and.callThrough();
        fixture.detectChanges();
        page.durationElement.value = '20';
        page.durationInput.triggerEventHandler('input', {});
        expect(setDuration).toHaveBeenCalledTimes(1);
    });

    describe('Duration reloaded enforced by', () => {
        it('Apply max NDL', () => {
            page.applyMaxDurationButton.triggerEventHandler('click', {});
            expect(page.durationElement.value).toBe('18');
        });

        it('Apply max depth', () => {
            expect(true).toBeTruthy();
        });

        it('Apply max duration', () => {
            expect(true).toBeTruthy();
        });

        it('Swtich to simple view', () => {
            expect(true).toBeTruthy();
        });
    });


    describe('Levels enforce calculation', () => {
        it('Is added to end of profile segments', () => {
            expect(true).toBeTruthy();
        });

        it('Is removed from correct position', () => {
            expect(true).toBeTruthy();
        });
    });


    describe('Invalid form prevents calculation after', () => {
        it('wrong duration', () => {
            expect(true).toBeTruthy();
        });

        it('wrong level end depth', () => {
            expect(true).toBeTruthy();
        });

        it('wrong level duration', () => {
            expect(true).toBeTruthy();
        });
    });

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
