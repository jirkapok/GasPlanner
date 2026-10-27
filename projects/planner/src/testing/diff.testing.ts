import { Provider, EnvironmentProviders } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { UnitConversion } from '../app/shared/UnitConversion';
import { ReloadDispatcher } from '../app/shared/reloadDispatcher';
import { DiveSchedules } from '../app/shared/dive.schedules';
import { PlannerService } from '../app/shared/planner.service';
import { ViewSwitchService } from '../app/shared/viewSwitchService';
import { ApplicationSettingsService } from '../app/shared/ApplicationSettings';
import { WorkersFactoryCommon } from '../app/shared/serial.workers.factory';
import { ProfileComparatorService } from '../app/shared/diff/profileComparatorService';
import { SelectedDiffWaypoint } from '../app/shared/diff/selected-diff-waypoint.service';
import { GasesComparisonService } from '../app/shared/diff/gases-comparison.service';
import { ResultsComparison } from '../app/shared/diff/results-comparison.service';
import { LanguageService } from '../app/shared/language.service';
import { provideTestTranslate } from './translate-testing.helpers';

/** Services needed to calculate and compare dives by the diff components */
export const diffTestProviders: (Provider | EnvironmentProviders)[] = [
    UnitConversion, ReloadDispatcher, DiveSchedules,
    PlannerService, ViewSwitchService, ApplicationSettingsService, WorkersFactoryCommon,
    ProfileComparatorService, SelectedDiffWaypoint, GasesComparisonService, ResultsComparison,
    DatePipe, provideTestTranslate(), LanguageService
];

/**
 * Adds second deeper dive, calculates both dives and compares them as profile A and B.
 * Everything happens outside Angular events, call it after the component was rendered.
 */
export const compareTwoCalculatedDives = (): void => {
    const schedules = TestBed.inject(DiveSchedules);
    const second = schedules.add();
    second.depths.plannedDepth = 40;
    const planner = TestBed.inject(PlannerService);
    planner.calculate(schedules.dives[0].id);
    planner.calculate(second.id);
    TestBed.inject(ProfileComparatorService).selectProfile(1);
};

/** Swaps profile A and B outside Angular events */
export const swapComparedProfiles = (): void => {
    TestBed.inject(ProfileComparatorService).selectProfile(0);
};
