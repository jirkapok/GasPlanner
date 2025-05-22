import { DecimalPipe } from '@angular/common';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
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
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { OptionsService } from '../../shared/options.service';

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
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DiveOptionsComponent);
        component = fixture.componentInstance;
    });

    it('Set complex calls view switch', inject(
        [ViewSwitchService],
        (viewSwitch: ViewSwitchService) => {
            const spy = spyOnProperty(viewSwitch, 'isComplex', 'set').and.callThrough();
            fixture.detectChanges();
            component.isComplex = false;
            expect(spy).toHaveBeenCalledWith(false);
        }
    ));
});

describe('DiveOptionsComponent - option methods', () => {
    let component: DiveOptionsComponent;
    let fixture: ComponentFixture<DiveOptionsComponent>;
    let optionsSpy: jasmine.SpyObj<OptionsService>;
    let dispatcherSpy: jasmine.SpyObj<ReloadDispatcher>;

    beforeEach(async () => {
        optionsSpy = jasmine.createSpyObj<OptionsService>(
            'OptionsService',
            ['useRecreational', 'useRecommended', 'switchAirBreaks']
        );
        dispatcherSpy = jasmine.createSpyObj<ReloadDispatcher>(
            'ReloadDispatcher',
            ['sendOptionsChanged']
        );

        await TestBed.configureTestingModule({
            declarations: [DiveOptionsComponent],
            imports: [ReactiveFormsModule],
            providers: [
                { provide: OptionsService,   useValue: optionsSpy },
                { provide: ReloadDispatcher, useValue: dispatcherSpy }
            ],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();

        fixture = TestBed.createComponent(DiveOptionsComponent);
        component = fixture.componentInstance;

        const emptyRootForm: FormGroup = TestBed.inject(FormBuilder).group({});
        component.rootForm = emptyRootForm;

        component.ngOnInit();
        spyOn(component.optionsForm, 'patchValue');
        fixture.detectChanges();
    });

    it('switchAirBreaks should trigger service, dispatch and reload', () => {
        component.switchAirBreaks();

        expect(optionsSpy['switchAirBreaks']).toHaveBeenCalledWith();
        expect(dispatcherSpy['sendOptionsChanged']).toHaveBeenCalledWith();
        expect(component.optionsForm['patchValue']).toHaveBeenCalled();
    });

    it('useRecreational should trigger service, dispatch and reload', () => {
        component.useRecreational();

        expect(optionsSpy['useRecreational']).toHaveBeenCalledWith();
        expect(dispatcherSpy['sendOptionsChanged']).toHaveBeenCalledWith();
        expect(component.optionsForm['patchValue']).toHaveBeenCalled();
    });

    it('useRecommended should trigger service, dispatch and reload', () => {
        component.useRecommended();

        expect(optionsSpy['useRecommended']).toHaveBeenCalledWith();
        expect(dispatcherSpy['sendOptionsChanged']).toHaveBeenCalledWith();
        expect(component.optionsForm['patchValue']).toHaveBeenCalled();
    });
});


