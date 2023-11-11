import { TestBed } from '@angular/core/testing';
import { StopsFilter } from './stopsFilter.service';
import { PlannerService } from './planner.service';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { TanksService } from './tanks.service';
import { UnitConversion } from './UnitConversion';
import { OptionsService } from './options.service';
import { WayPointsService } from './waypoints.service';
import { DepthsService } from './depths.service';
import { DelayedScheduleService } from './delayedSchedule.service';
import { SubViewStorage } from './subViewStorage';
import { ViewStates } from './viewStates';
import { Preferences } from './preferences';
import { PreferencesStore } from './preferencesStore';
import { ViewSwitchService } from './viewSwitchService';
import { DiveResults } from './diveresults';

describe('Stops filter', () => {
    let service: StopsFilter;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [StopsFilter, PlannerService,
                WorkersFactoryCommon, TanksService, UnitConversion,
                OptionsService, WayPointsService, DepthsService,
                DelayedScheduleService, SubViewStorage,
                PreferencesStore, Preferences, DiveResults,
                ViewStates, ViewSwitchService, DepthsService
            ]
        });
        service = TestBed.inject(StopsFilter);
        const planner = TestBed.inject(PlannerService);
        planner.calculate();
    });

    it('When disabled returns all waypoints', () => {
        const count = service.wayPoints.length;
        expect(count).toEqual(7);
    });

    it('Default profile filters ascent', () => {
        service.switchFilter();
        const count = service.wayPoints.length;

        const expected = [
            { startDepth: 0, endDepth: 30, duration: 102 },
            { startDepth: 30, endDepth: 30, duration: 618 },
            { startDepth: 3, endDepth: 3, duration: 180 },
            { startDepth: 3, endDepth: 0, duration: 60 }
        ];

        expect(count).toEqual(4);
        const current = service.wayPoints.map(i => ({
            startDepth: i.startDepth,
            endDepth: i.endDepth,
            duration: i.duration
        }));
        expect(current).toEqual(expected);
    });
});
