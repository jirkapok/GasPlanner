import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DiveOptionsComponent } from './diveoptions.component';
import { InputControls } from '../../shared/inputcontrols';
import { PlannerService } from '../../shared/planner.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { UnitConversion } from '../../shared/UnitConversion';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { WayPointsService } from '../../shared/waypoints.service';
import { ViewStates } from '../../shared/viewStates';
import { SubViewStorage } from '../../shared/subViewStorage';
import { Preferences } from '../../shared/preferences';
import { PreferencesStore } from '../../shared/preferencesStore';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';
import { MdbModalService } from "mdb-angular-ui-kit/modal";

describe('Dive options component', () => {
    let component: DiveOptionsComponent;
    let fixture: ComponentFixture<DiveOptionsComponent>;
    let schedules: DiveSchedules;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DiveOptionsComponent],
            imports: [ReactiveFormsModule],
            providers: [
                WorkersFactoryCommon, DecimalPipe,
                InputControls, DiveSchedules,
                ValidatorGroups, PlannerService,
                UnitConversion, ReloadDispatcher,
                ViewSwitchService, WayPointsService,
                ViewStates, SubViewStorage,
                Preferences, PreferencesStore,
                ApplicationSettingsService,
                MdbModalService
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DiveOptionsComponent);
        component = fixture.componentInstance;
        schedules = TestBed.inject(DiveSchedules);

        component.ngOnInit();
        fixture.detectChanges();
    });

    it('Set complex calls wiew switch', inject([ViewSwitchService], (viewSwitch: ViewSwitchService) => {
        const spy = spyOnProperty(viewSwitch, 'isComplex', 'set')
            .and.callThrough();
        fixture.detectChanges();
        component.isComplex = false;
        expect(spy).toHaveBeenCalledWith(false);
    }
    ));

    it('should call switchAirBreaks on selectedOptions', () => {
        const switchSpy = spyOn(schedules.selectedOptions, 'switchAirBreaks');
        const dispatchSpy = spyOn(TestBed.inject(ReloadDispatcher),'sendOptionsChanged');

        component.switchAirBreaks();

        expect(switchSpy).toHaveBeenCalledWith();
        expect(dispatchSpy).toHaveBeenCalledWith();
    });

    it('should call useRecreational on selectedOptions and notify scheduler', () => {
        const recSpy = spyOn(schedules.selectedOptions, 'useRecreational');
        const dispatchSpy = spyOn(TestBed.inject(ReloadDispatcher), 'sendOptionsChanged');

        component.useRecreational();

        expect(recSpy).toHaveBeenCalledWith();
        expect(dispatchSpy).toHaveBeenCalledWith();
    });

    it('should call useRecommended on selectedOptions and notify scheduler', () => {
        const recoSpy = spyOn(schedules.selectedOptions, 'useRecommended');
        const dispatchSpy = spyOn(TestBed.inject(ReloadDispatcher), 'sendOptionsChanged');

        component.useRecommended();

        expect(recoSpy).toHaveBeenCalledWith();
        expect(dispatchSpy).toHaveBeenCalledWith();
    });
});

