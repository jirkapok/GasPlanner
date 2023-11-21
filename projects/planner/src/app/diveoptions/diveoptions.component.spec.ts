import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { InputControls } from '../shared/inputcontrols';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { DiveOptionsComponent } from './diveoptions.component';
import { WayPointsService } from '../shared/waypoints.service';
import { ViewStates } from '../shared/viewStates';
import { SubViewStorage } from '../shared/subViewStorage';
import { Preferences } from '../shared/preferences';
import { PreferencesStore } from '../shared/preferencesStore';
import { DiveSchedules } from '../shared/dive.schedules';
import { ReloadDispatcher } from '../shared/reloadDispatcher';

describe('Dive options component', () => {
    let component: DiveOptionsComponent;
    let fixture: ComponentFixture<DiveOptionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DiveOptionsComponent],
            imports: [ReactiveFormsModule],
            providers: [
                WorkersFactoryCommon, DecimalPipe,
                InputControls, DiveSchedules,
                ValidatorGroups, PlannerService,
                DelayedScheduleService, UnitConversion,
                ViewSwitchService, WayPointsService,
                ViewStates, SubViewStorage,
                Preferences, PreferencesStore,
                ReloadDispatcher
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DiveOptionsComponent);
        component = fixture.componentInstance;
    });

    it('Set complex calls wiew switch', inject([ViewSwitchService], (viewSwitch: ViewSwitchService) => {
        const spy = spyOnProperty(viewSwitch, 'isComplex', 'set')
            .and.callThrough();
        fixture.detectChanges();
        component.isComplex = false;
        expect(spy).toHaveBeenCalledWith(false);
    }));
});
