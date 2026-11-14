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
import { planTestProviders } from '../../../testing/plan.testing';
import { CircuitType } from 'scuba-physics';

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

describe('WayPointsComponent view switch', () => {
    it('renders complex view switched outside the component', async () => {
        TestBed.configureTestingModule({
            imports: [WayPointsComponent],
            providers: [...planTestProviders, SelectedWaypoint, StopsFilter]
        });
        const fixture = await renderOnPush(WayPointsComponent);
        const text = (): string | null => (fixture.nativeElement as HTMLElement).textContent;
        expect(text()).not.toContain('waypointsTable.gas');

        TestBed.inject(ViewSwitchService).isComplex = true;
        await fixture.whenStable();

        expect(text()).toContain('waypointsTable.gas');
    });
});

describe('WayPointsComponent rebreather', () => {
    let fixture: ComponentFixture<WayPointsComponent>;

    const element = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const rows = (): NodeListOf<HTMLTableRowElement> => element().querySelectorAll('tbody tr');

    const useMccr = async (): Promise<void> => {
        const dive = TestBed.inject(DiveSchedules).selected;
        TestBed.inject(ViewSwitchService).isComplex = true;
        dive.tanksService.prepareForClosedCircuit();
        dive.optionsService.circuit = CircuitType.mccr;
        TestBed.inject(ReloadDispatcher).sendOptionsChanged();
        TestBed.inject(PlannerService).calculate(dive.id);
        await fixture.whenStable();
    };

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [WayPointsComponent],
            providers: [...planTestProviders, SelectedWaypoint, StopsFilter]
        });
        fixture = await renderOnPush(WayPointsComponent);
    });

    it('open circuit has no profile tabs', async () => {
        TestBed.inject(PlannerService).calculate(1);
        await fixture.whenStable();
        expect(element().querySelector('#waypointsDiveTab')).toBeNull();
    });

    it('rebreather switches to bailout profile', async () => {
        await useMccr();
        const diveRows = rows().length;

        (element().querySelector('#waypointsBailoutTab') as HTMLButtonElement).click();
        await fixture.whenStable();

        expect(TestBed.inject(ViewSwitchService).showBailoutProfile).toBe(true);
        expect(rows().length).toBe(TestBed.inject(StopsFilter).wayPoints.length);
        expect(rows().length).not.toBe(diveRows);
    });

    it('closed circuit loop rows show the setpoint', async () => {
        await useMccr();
        expect(element().querySelector('tbody')?.textContent).toContain('waypointsTable.setpoint 1.3');
    });
});
