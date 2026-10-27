import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { WayPointsComponent } from './waypoints.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { PlannerService } from '../../shared/planner.service';
import { WorkersFactoryCommon } from '../../shared/serial.workers.factory';
import { ViewSwitchService } from '../../shared/viewSwitchService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';
import { ApplicationSettingsService } from '../../shared/ApplicationSettings';
import { SelectedWaypoint } from '../../shared/selectedwaypointService';
import { StopsFilter } from '../../shared/stopsFilter.service';
import { LanguageService } from '../../shared/language.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';

describe('WayPointsComponent', () => {
    let fixture: ComponentFixture<WayPointsComponent>;

    const rows = (): NodeListOf<HTMLTableRowElement> =>
        (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [WayPointsComponent],
            providers: [
                UnitConversion, PlannerService, WorkersFactoryCommon,
                ViewSwitchService, ReloadDispatcher, DiveSchedules,
                ApplicationSettingsService, SelectedWaypoint, StopsFilter,
                DatePipe, provideTestTranslate(), LanguageService
            ]
        });

        fixture = await renderOnPush(WayPointsComponent);
    });

    it('renders way points calculated outside Angular events', async () => {
        TestBed.inject(PlannerService).calculate(1);
        await fixture.whenStable();

        const wayPoints = TestBed.inject(StopsFilter).wayPoints;
        expect(wayPoints.length).toBeGreaterThan(1);
        expect(rows().length).toBe(wayPoints.length);
    });

    it('renders way point selected in profile chart', async () => {
        TestBed.inject(PlannerService).calculate(1);
        await fixture.whenStable();

        const selectedWaypoint = TestBed.inject(SelectedWaypoint);
        selectedWaypoint.selected = TestBed.inject(StopsFilter).wayPoints[1];
        await fixture.whenStable();

        expect(rows()[1].classList).toContain('table-active');
    });
});
