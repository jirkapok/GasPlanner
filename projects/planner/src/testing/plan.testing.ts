import { EnvironmentProviders, Provider } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { WorkersFactoryCommon } from '../app/shared/serial.workers.factory';
import { PlannerService } from '../app/shared/planner.service';
import { UnitConversion } from '../app/shared/UnitConversion';
import { InputControls } from '../app/shared/inputcontrols';
import { ValidatorGroups } from '../app/shared/ValidatorGroups';
import { ViewSwitchService } from '../app/shared/viewSwitchService';
import { WayPointsService } from '../app/shared/waypoints.service';
import { SubViewStorage } from '../app/shared/subViewStorage';
import { ViewStates } from '../app/shared/viewStates';
import { DiveSchedules } from '../app/shared/dive.schedules';
import { ManagedDiveSchedules } from '../app/shared/managedDiveSchedules';
import { DelayedScheduleService } from '../app/shared/delayedSchedule.service';
import { PreferencesStore } from '../app/shared/preferencesStore';
import { Preferences } from '../app/shared/preferences';
import { ReloadDispatcher } from '../app/shared/reloadDispatcher';
import { ApplicationSettingsService } from '../app/shared/ApplicationSettings';
import { OptionsService } from '../app/shared/options.service';
import { LanguageService } from '../app/shared/language.service';
import { provideTestTranslate } from './translate-testing.helpers';

/** Services needed by the plan (dashboard) components, which edit the selected dive */
export const planTestProviders: (Provider | EnvironmentProviders)[] = [
    WorkersFactoryCommon, PlannerService, UnitConversion,
    InputControls, ValidatorGroups, DecimalPipe, DatePipe,
    ViewSwitchService, WayPointsService, SubViewStorage, ViewStates,
    DiveSchedules, ManagedDiveSchedules, DelayedScheduleService,
    PreferencesStore, Preferences, ReloadDispatcher,
    ApplicationSettingsService, OptionsService, MdbModalService,
    LanguageService, provideTestTranslate(), provideNoopAnimations(),
    provideHttpClient(withXhr()), provideHttpClientTesting()
];
