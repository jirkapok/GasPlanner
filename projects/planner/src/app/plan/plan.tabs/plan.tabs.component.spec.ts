import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanTabsComponent } from './plan.tabs.component';
import { MdbTabsModule } from 'mdb-angular-ui-kit/tabs';
import { DiveSchedules } from '../../shared/dive.schedules';
import { UnitConversion } from '../../shared/UnitConversion';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { ManagedDiveSchedules } from '../../shared/managedDiveSchedules';
import { PreferencesStore } from '../../shared/preferencesStore';
import { Preferences } from '../../shared/preferences';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { ViewStates } from '../../shared/viewStates';
import { DelayedScheduleService } from '../../shared/delayedSchedule.service';
import { PlannerService } from '../../shared/planner.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { SubViewStorage } from '../../shared/subViewStorage';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LanguageService } from '../../shared/language.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';
import { planTestProviders } from '../../../testing/plan.testing';

describe('PlanTabsComponent', () => {
    let component: PlanTabsComponent;
    let fixture: ComponentFixture<PlanTabsComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [MdbTabsModule, PlanTabsComponent],
            providers: [
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                UnitConversion, ReloadDispatcher,
                DiveSchedules, ManagedDiveSchedules,
                PreferencesStore, Preferences,
                ViewSwitchService, ViewStates,
                DelayedScheduleService, PlannerService,
                WorkersFactoryCommon, SubViewStorage,
                ApplicationSettingsService,
                MdbModalService, LanguageService, provideTestTranslate()
            ]
        });
        fixture = TestBed.createComponent(PlanTabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

describe('PlanTabsComponent OnPush', () => {
    let fixture: ComponentFixture<PlanTabsComponent>;

    const text = (): string | null => (fixture.nativeElement as HTMLElement).textContent;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [MdbTabsModule, PlanTabsComponent],
            providers: planTestProviders
        });
        fixture = await renderOnPush(PlanTabsComponent);
    });

    it('renders tab of dive added outside the component', async () => {
        const schedules = TestBed.inject(DiveSchedules);
        const second = schedules.add();
        await fixture.whenStable();

        expect(text()).toContain(second.title);
    });

    it('renders removed dive tab', async () => {
        const schedules = TestBed.inject(DiveSchedules);
        const second = schedules.add();
        await fixture.whenStable();
        const title = second.title;
        expect(text()).toContain(title);

        schedules.remove(second);
        await fixture.whenStable();

        expect(text()).not.toContain(title);
    });
});

describe('PlanTabsComponent OnPush title', () => {
    it('renders title of depth changed outside the component', async () => {
        TestBed.configureTestingModule({
            imports: [MdbTabsModule, PlanTabsComponent],
            providers: planTestProviders
        });
        const fixture = await renderOnPush(PlanTabsComponent);

        TestBed.inject(DiveSchedules).selectedDepths.plannedDepth = 40;
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).textContent).toContain('1. 40 m');
    });
});

describe('PlanTabsComponent OnPush titles reset', () => {
    it('renders titles of all dives reset to simple', async () => {
        TestBed.configureTestingModule({
            imports: [MdbTabsModule, PlanTabsComponent],
            providers: planTestProviders
        });
        const fixture = await renderOnPush(PlanTabsComponent);
        const schedules = TestBed.inject(DiveSchedules);
        const second = schedules.add();
        second.depths.plannedDepth = 20;
        second.depths.addSegment();
        second.depths.levels[0].duration = 0.1;
        second.depths.levels[1].duration = 0.1;
        second.depths.levels[2].duration = 0.1;
        second.depths.levelChanged();
        await fixture.whenStable();
        const complexTitle = second.title;
        const text = (): string | null => (fixture.nativeElement as HTMLElement).textContent;
        expect(text()).toContain(complexTitle);

        TestBed.inject(ViewSwitchService).isComplex = false;
        await fixture.whenStable();

        expect(second.title).not.toBe(complexTitle);
        expect(text()).toContain(second.title);
        expect(text()).not.toContain(complexTitle);
    });
});
