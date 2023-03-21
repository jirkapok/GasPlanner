import { SelectedWaypoint } from './selectedwaypointService';
import { inject, TestBed } from '@angular/core/testing';
import { PlannerService } from './planner.service';
import { Segment, StandardGases } from 'scuba-physics';
import { WayPoint } from './models';
import { WorkersFactoryCommon } from './serial.workers.factory';
import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { Plan } from './plan.service';
import { DepthsService } from './depths.service';
import { DelayedScheduleService } from './delayedSchedule.service';
import { OptionsDispatcherService } from './options-dispatcher.service';
import { TestBedExtensions } from './TestBedCommon.spec';

describe('Selected Waypoint', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                WorkersFactoryCommon, PlannerService,
                UnitConversion, TanksService,
                Plan, DepthsService, DelayedScheduleService, OptionsDispatcherService]
        });

        TestBedExtensions.initPlan();
    });

    it('Selected assigned fires event', inject([PlannerService],
        (planner: PlannerService) => {
            const expected = WayPoint.fromSegment(new Segment(5, 10, StandardGases.air, 60));
            let received: WayPoint | undefined;

            const sut = new SelectedWaypoint(planner);
            sut.selectedChanged.subscribe((wayPoint) => {
                received = wayPoint;
            });

            sut.selected = expected;
            expect(received).toEqual(expected);
        }));

    it('Undefined assigned fires event', inject([PlannerService],
        (planner: PlannerService) => {
            let received: WayPoint | undefined;

            const sut = new SelectedWaypoint(planner);
            sut.selectedChanged.subscribe((wayPoint) => {
                received = wayPoint;
            });

            sut.selected = undefined;
            expect(received).toEqual(undefined);
        }));

    it('Select by time stamp fires event', inject([PlannerService],
        (planner: PlannerService) => {
            let received: WayPoint | undefined;

            const sut = new SelectedWaypoint(planner);
            sut.selectedChanged.subscribe((wayPoint) => {
                received = wayPoint;
            });

            planner.calculate();
            sut.selectedTimeStamp = '1/1/1970 0:8:00';
            const expected = planner.dive.wayPoints[1];
            expect(received).toEqual(expected);
        }));

    it('Selected assigned marks item as selected', inject([PlannerService],
        (planner: PlannerService) => {
            const first = WayPoint.fromSegment(new Segment(5, 10, StandardGases.air, 60));
            const second = WayPoint.fromSegment(new Segment(5, 10, StandardGases.air, 60));
            const sut = new SelectedWaypoint(planner);
            sut.selected = first;
            sut.selected = second;
            expect(first.selected).toBeFalsy();
            expect(second.selected).toBeTruthy();
        }));
});
