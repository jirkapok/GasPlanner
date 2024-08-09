import { SelectedWaypoint } from './selectedwaypointService';
import { inject, TestBed } from '@angular/core/testing';
import { Segment, StandardGases } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import {ReloadDispatcher} from './reloadDispatcher';
import {DiveSchedules} from './dive.schedules';
import {TestBedExtensions} from './TestbedExtensions.spec';
import { WayPoint } from './wayPoint';

describe('Selected Waypoint', () => {
    const segment = new Segment(5, 10, StandardGases.air, 60);
    let sut: SelectedWaypoint;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SelectedWaypoint,
                UnitConversion, ReloadDispatcher,
                DiveSchedules
            ]
        });

        sut = TestBed.inject(SelectedWaypoint);
    });

    it('Selected assigned fires event', inject([UnitConversion],
        (units: UnitConversion) => {
            const expected = WayPoint.fromSegment(units, segment);
            let received: WayPoint | undefined;

            sut.selectedChanged.subscribe((wayPoint) => {
                received = wayPoint;
            });

            sut.selected = expected;
            expect(received).toEqual(expected);
        }));

    it('Undefined assigned fires event', () => {
        let received: WayPoint | undefined;

        sut.selectedChanged.subscribe((wayPoint) => {
            received = wayPoint;
        });

        sut.selected = undefined;
        expect(received).toEqual(undefined);
    });

    it('Select by time stamp fires event', inject([DiveSchedules],
        (schedules: DiveSchedules) => {
            let received: WayPoint | undefined;

            sut.selectedChanged.subscribe((wayPoint) => {
                received = wayPoint;
            });

            const dive = schedules.selected.diveResult;
            dive.wayPoints = TestBedExtensions.sampleWayPoints();
            sut.selectedTimeStamp = '1/1/1970 0:8:00';
            const expected = schedules.selected.diveResult.wayPoints[1];

            expect(received).toEqual(expected);
        }));

    it('Selected assigned marks item as selected', inject([UnitConversion],
        (units: UnitConversion) => {
            const first = WayPoint.fromSegment(units, segment);
            const second = WayPoint.fromSegment(units, segment);
            sut.selected = first;
            sut.selected = second;
            expect(first.selected).toBeFalsy();
            expect(second.selected).toBeTruthy();
        }));
});
