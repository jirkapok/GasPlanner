import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
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
    });

    it('Set complex calls wiew switch', inject([ViewSwitchService], (viewSwitch: ViewSwitchService) => {
        const spy = spyOnProperty(viewSwitch, 'isComplex', 'set')
            .and.callThrough();
        fixture.detectChanges();
        component.isComplex = false;
        expect(spy).toHaveBeenCalledWith(false);
    }
    ));

    describe('Option methods', () => {
        let schedules: DiveSchedules;
        let fb: NonNullableFormBuilder;

        beforeEach(inject(
            [DiveSchedules, NonNullableFormBuilder],
            (_schedules: DiveSchedules, _fb: NonNullableFormBuilder) => {
                schedules = _schedules;
                fb = _fb;
                component.rootForm = fb.group({});
                component.ngOnInit();
                fixture.detectChanges();
            }
        ));

        it('should call switchAirBreaks on selectedOptions', () => {
            const switchSpy = spyOn(schedules.selectedOptions, 'switchAirBreaks');
            component.switchAirBreaks();
            expect(switchSpy).toHaveBeenCalledWith();
        });

        it('should call useRecreational on selectedOptions', () => {
            const recSpy = spyOn(schedules.selectedOptions, 'useRecreational');
            component.useRecreational();
            expect(recSpy).toHaveBeenCalledWith();
        });

        it('should call useRecommended on selectedOptions', () => {
            const recoSpy = spyOn(schedules.selectedOptions, 'useRecommended');
            component.useRecommended();
            expect(recoSpy).toHaveBeenCalledWith();
        });
    });
});
