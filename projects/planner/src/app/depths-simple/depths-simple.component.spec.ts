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
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { DiveResults } from '../shared/diveresults';
import {DiveSchedules} from '../shared/dive.schedules';

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
                UnitConversion, InputControls, DiveSchedules,
                OptionsService, ValidatorGroups, DelayedScheduleService,
                DepthsService, DecimalPipe, TanksService,
                ViewSwitchService, Plan, WayPointsService,
                SubViewStorage, ViewStates, PreferencesStore, Preferences,
                DiveResults
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthsSimpleComponent);
        component = fixture.componentInstance;
        depths = component.depths;
        fixture.detectChanges();
        simplePage = new SimpleDepthsPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        spyOn(scheduler, 'schedule')
            .and.callFake(() => {
                // planner.calculate();
            });
    });

    it('Duration change enforces calculation', () => {
        let eventFired = false;
        component.depths.changed$.subscribe(() => eventFired = true);
        simplePage.durationInput.value = '20';
        simplePage.durationInput.dispatchEvent(new Event('input'));
        expect(eventFired).toBeTruthy();
    });

    describe('Duration reloaded enforced by', () => {
        it('Apply max NDL', inject([DiveSchedules], (schedule: DiveSchedules) => {
            let eventFired = false;
            component.depths.changed$.subscribe(() => eventFired = true );
            schedule.selected.diveResult.noDecoTime = 21;
            const assignDurationSpy = spyOn(schedule.selected.plan, 'assignDuration').and.callThrough();
            simplePage.applyNdlButton.click();
            expect(assignDurationSpy).toHaveBeenCalledWith(21, jasmine.any(Object), jasmine.any(Object));
            expect(eventFired).toBeTruthy();
        }));

        it('Apply max duration', inject([DiveSchedules], (schedule: DiveSchedules) => {
            let eventFired = false;
            schedule.selected.diveResult.maxTime = 19;
            component.depths.changed$.subscribe(() => eventFired = true );
            simplePage.applyMaxDurationButton.click();
            expect(eventFired).toBeTruthy();
            expect(simplePage.durationInput.value).toBe('19');
        }));
    });

    it('wrong duration doesn\'t call calculate', () => {
        const durationSpy = spyOnProperty(depths, 'planDuration')
            .and.callThrough();

        simplePage.durationInput.value = 'aaa';
        simplePage.durationInput.dispatchEvent(new Event('input'));
        expect(durationSpy).not.toHaveBeenCalled();
    });

    describe('Max narcotic depth', () => {
        it('Is calculated 30 m for Air with 30m max. narcotic depth option', inject([DiveSchedules],
            (schedules: DiveSchedules) => {
                depths.applyMaxDepth();
                expect(schedules.selected.plan.maxDepth).toBe(30);
            }));

        it('Max narcotic depth is applied', inject([DiveSchedules],
            (schedules: DiveSchedules) => {
                const selected = schedules.selected;
                selected.tanksService.firstTank.o2 = 50;
                selected.depths.applyMaxDepth();
                expect(selected.plan.maxDepth).toBe(18);
            }));
    });
});
