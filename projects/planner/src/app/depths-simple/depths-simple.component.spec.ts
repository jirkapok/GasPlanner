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
import { ViewSwitchService } from '../shared/viewSwitchService';
import { WayPointsService } from '../shared/waypoints.service';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';

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
            providers: [
                WorkersFactoryCommon, PlannerService,
                UnitConversion, InputControls, DiveSchedules,
                OptionsService, ValidatorGroups,
                DecimalPipe, ViewSwitchService,  WayPointsService,
                SubViewStorage, ViewStates, PreferencesStore,
                Preferences, ReloadDispatcher
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
    });

    it('Duration change enforces calculation', inject([ReloadDispatcher], (dispatcher: ReloadDispatcher) => {
        let eventFired = false;
        dispatcher.depthChanged$.subscribe(() => eventFired = true);
        simplePage.durationInput.value = '20';
        simplePage.durationInput.dispatchEvent(new Event('input'));
        expect(eventFired).toBeTruthy();
    }));

    // TODO test for surface interval validation

    describe('Duration reloaded enforced by', () => {
        it('Apply max NDL', inject([DiveSchedules, ReloadDispatcher],
            (schedule: DiveSchedules, dispatcher: ReloadDispatcher) => {
                let eventFired = false;
                dispatcher.depthChanged$.subscribe(() => eventFired = true );
                schedule.selected.diveResult.noDecoTime = 21;
                const assignDurationSpy = spyOn(schedule.selected.depths, 'applyNdlDuration').and.callThrough();
                simplePage.applyNdlButton.click();
                expect(assignDurationSpy).toHaveBeenCalledWith();
                expect(schedule.selected.depths.planDuration).toBe(21);
                expect(eventFired).toBeTruthy();
            }));

        it('Apply max duration', inject([DiveSchedules, ReloadDispatcher],
            (schedule: DiveSchedules, dispatcher: ReloadDispatcher) => {
                let eventFired = false;
                schedule.selected.diveResult.maxTime = 19;
                dispatcher.depthChanged$.subscribe(() => eventFired = true );
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
                expect(schedules.selected.depths.plannedDepthMeters).toBe(30);
            }));

        it('Max narcotic depth is applied', inject([DiveSchedules],
            (schedules: DiveSchedules) => {
                const selected = schedules.selected;
                selected.tanksService.firstTank.o2 = 50;
                selected.depths.applyMaxDepth();
                expect(selected.depths.plannedDepthMeters).toBe(18);
            }));
    });
});
