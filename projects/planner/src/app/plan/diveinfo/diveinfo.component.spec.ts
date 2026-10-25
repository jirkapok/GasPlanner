import { MockInstance } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { MdbTabComponent, MdbTabsComponent } from 'mdb-angular-ui-kit/tabs';

import { DiveInfoComponent } from './diveinfo.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { PlannerService } from '../../shared/planner.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { WayPointsService } from '../../shared/waypoints.service';
import { SubViewStorage } from '../../shared/subViewStorage';
import { ViewStates } from '../../shared/viewStates';
import { PreferencesStore } from '../../shared/preferencesStore';
import { Preferences } from '../../shared/preferences';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ShareDiveService } from '../../shared/ShareDiveService';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { LanguageService } from '../../shared/language.service';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';

describe('DiveInfoComponent', () => {
    let component: DiveInfoComponent;
    let fixture: ComponentFixture<DiveInfoComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DiveInfoComponent],
            declarations: [MdbTabComponent, MdbTabsComponent],
            providers: [
                UnitConversion, PlannerService, SubViewStorage,
                WorkersFactoryCommon, WayPointsService,
                ViewStates, PreferencesStore, Preferences,
                ViewSwitchService, ReloadDispatcher,
                DiveSchedules, ShareDiveService, ApplicationSettingsService, DatePipe,
                MdbModalService, provideTestTranslate(), LanguageService
            ]
        });
        fixture = TestBed.createComponent(DiveInfoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('In liters switch', () => {
        let planner: PlannerService;
        let viewSwitch: ViewSwitchService;
        let saveSpy: MockInstance;

        const consumedTab = (): HTMLElement => {
            component.tabs?.setActiveTab(1);
            fixture.detectChanges();
            return fixture.nativeElement as HTMLElement;
        };

        const toggle = (): void => {
            const input = fixture.nativeElement.querySelector('#consumptionInLiters') as HTMLInputElement;
            input.click();
            fixture.detectChanges();
        };

        beforeEach(() => {
            planner = TestBed.inject(PlannerService);
            viewSwitch = TestBed.inject(ViewSwitchService);
            saveSpy = vi.spyOn(TestBed.inject(PreferencesStore), 'save').mockImplementation(() => {});
            planner.calculate(1);
            consumedTab();
        });

        it('Shows tanks by default', () => {
            const element = consumedTab();
            expect(element.querySelectorAll('app-tankchart').length).toEqual(1);
            expect(element.querySelectorAll('app-gaschart').length).toEqual(0);
        });

        it('Switch shows consumption by gas', () => {
            toggle();
            const element = consumedTab();
            expect(viewSwitch.consumptionInLiters).toBe(true);
            expect(element.querySelectorAll('app-gaschart').length).toEqual(1);
            expect(element.querySelectorAll('app-tankchart').length).toEqual(0);
        });

        it('Switch saves preferences', () => {
            toggle();
            expect(saveSpy).toHaveBeenCalledTimes(1);
        });

        it('Switch does not recalculate', () => {
            const calculateSpy = vi.spyOn(planner, 'calculate').mockImplementation(() => {});
            toggle();
            toggle();
            expect(viewSwitch.consumptionInLiters).toBe(false);
            expect(calculateSpy).not.toHaveBeenCalled();
        });
    });
});
