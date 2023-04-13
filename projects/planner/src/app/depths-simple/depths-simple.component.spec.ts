import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { OptionsService } from '../shared/options.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthsSimpleComponent } from './depths-simple.component';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { TanksService } from '../shared/tanks.service';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { Plan } from '../shared/plan.service';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { WayPointsService } from '../shared/waypoints.service';

export class SimpleDepthsPage {
    constructor(private fixture: ComponentFixture<DepthsSimpleComponent>) { }

    public get durationInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#duration')).nativeElement as HTMLInputElement;
    }

    public get applyMaxDurationButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#btnApplyDuration')).nativeElement as HTMLButtonElement;
    }

    public get applyNdlButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#btnApplyNdl')).nativeElement as HTMLButtonElement;
    }
}

describe('Depths Simple Component', () => {
    let component: DepthsSimpleComponent;
    let depths: DepthsService;
    let fixture: ComponentFixture<DepthsSimpleComponent>;
    let simplePage: SimpleDepthsPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepthsSimpleComponent],
            imports: [ReactiveFormsModule],
            providers: [WorkersFactoryCommon, PlannerService,
                UnitConversion, InputControls, DelayedScheduleService,
                OptionsService, ValidatorGroups,
                DepthsService, DecimalPipe, TanksService,
                ViewSwitchService, Plan, WayPointsService
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthsSimpleComponent);
        component = fixture.componentInstance;
        depths = component.depths;
        component.planner.calculate();
        fixture.detectChanges();
        simplePage = new SimpleDepthsPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        spyOn(scheduler, 'schedule')
            .and.callFake(() => {
                component.planner.calculate();
            });
    });

    it('Duration change enforces calculation', () => {
        simplePage.durationInput.value = '20';
        simplePage.durationInput.dispatchEvent(new Event('input'));
        expect(depths.planDuration).toBe(20);
    });

    describe('Duration reloaded enforced by', () => {
        it('Apply max NDL', () => {
            simplePage.applyNdlButton.click();
            expect(simplePage.durationInput.value).toBe('13');
        });

        it('Apply max duration', () => {
            simplePage.applyMaxDurationButton.click();
            expect(simplePage.durationInput.value).toBe('19');
        });
    });

    it('wrong duration doesn\'t call calculate', () => {
        const durationSpy = spyOnProperty(depths, 'planDuration')
            .and.callThrough();

        simplePage.durationInput.value = 'aaa';
        simplePage.durationInput.dispatchEvent(new Event('input'));
        expect(durationSpy).not.toHaveBeenCalled();
    });

    describe('Max narcotic depth', () => {
        it('Is calculated 30 m for Air with 30m max. narcotic depth option', inject([Plan],
            (plan: Plan) => {
                depths.applyMaxDepth();
                expect(plan.maxDepth).toBe(30);
            }));

        it('Max narcotic depth is applied', inject([TanksService, Plan],
            (tanksService: TanksService, plan: Plan) => {
                tanksService.firstTank.o2 = 50;
                depths.applyMaxDepth();
                expect(plan.maxDepth).toBe(18);
            }));
    });
});
