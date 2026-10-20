import { WayPoint, SwimAction } from './wayPoint';
import { UnitConversion } from './UnitConversion';
import { Segment, GasNames } from 'scuba-physics';

describe('WayPoint', () => {
    const mockMetersUnits = {
        fromMeters: (value: number) => value
    } as unknown as UnitConversion;
    const mockFeetUnits = {
        fromMeters: (value: number) => value * 3.28084
    } as unknown as UnitConversion;
    const makeSegment = (overrides: Record<string, unknown> = {}): Segment =>
        ({
            duration: 60,
            startDepth: 10,
            endDepth: 10,
            speed: 0,
            gas: {
                fO2: 0.21,
                fHe: 0
            },
            ...overrides
        } as Segment);

    it('returns start depth in meters', () => {
        const segment = makeSegment({ startDepth: 10, endDepth: 12 });
        const waypointMeters = WayPoint.fromSegment(mockMetersUnits, segment);

        expect(waypointMeters.startDepthMeters).toBe(10);
        expect(waypointMeters.startDepth).toBe(10);
    });

    it('returns start depth in feet', () => {
        const segment = makeSegment({ startDepth: 10, endDepth: 12 });
        const waypointFeet = WayPoint.fromSegment(mockFeetUnits, segment);

        expect(waypointFeet.startDepthMeters).toBe(10);
        expect(waypointFeet.startDepth).toBeCloseTo(32.8084, 4);
    });

    it('returns end depth in meters', () => {
        const segment = makeSegment({ startDepth: 10, endDepth: 20 });
        const waypointMeters = WayPoint.fromSegment(mockMetersUnits, segment);

        expect(waypointMeters.endDepthMeters).toBe(20);
        expect(waypointMeters.endDepth).toBe(20);
    });

    it('returns end depth in feet', () => {
        const segment = makeSegment({ startDepth: 10, endDepth: 20 });
        const waypointFeet = WayPoint.fromSegment(mockFeetUnits, segment);

        expect(waypointFeet.endDepthMeters).toBe(20);
        expect(waypointFeet.endDepth).toBeCloseTo(65.6168, 4);
    });

    it('copies successfully', () => {
        const waypoint = WayPoint.fromSegment(
            mockMetersUnits,
            makeSegment({
                duration: 30,
                startDepth: 10,
                endDepth: 20,
                speed: 0.5
            }),
            5
        );

        const copy = waypoint.copy;

        expect(copy).not.toBe(waypoint);
        expect(copy.startTime).toBe(waypoint.startTime);
        expect(copy.endTime).toBe(waypoint.endTime);
        expect(copy.startDepthMeters).toBe(waypoint.startDepthMeters);
        expect(copy.endDepthMeters).toBe(waypoint.endDepthMeters);
        expect(copy.gasName).toBe(waypoint.gasName);
        expect(copy.depthAt(2)).toBe(waypoint.depthAt(2));
    });

    it("deep-copies waypoints", () => {
        const originals = [
            WayPoint.fromSegment(
                mockMetersUnits,
                makeSegment()
            ),
            WayPoint.fromSegment(
                mockFeetUnits,
                makeSegment({ startDepth: 20, endDepth: 30 })
            )
        ];
        const copies = WayPoint.deepCopyWayPoints(originals) as WayPoint[];

        expect(copies[0]).not.toBe(originals[0]);
        expect(copies[0]).toEqual(originals[0]);
        expect(copies[1]).not.toBe(originals[1]);
        expect(copies[1]).toEqual(originals[1]);

        copies[0].endTime = 42
        originals[0].endTime = 999;
        expect(copies[0].endTime).toEqual(42);
    });

    it('creates new WayPoint from segment', () => {
        const segment = makeSegment({
            duration: 60,
            startDepth: 5,
            endDepth: 15
        });

        const waypoint = WayPoint.fromSegment(mockMetersUnits, segment, 10);

        expect(waypoint.startTime).toBe(10);
        expect(waypoint.endTime).toBe(70);
        expect(waypoint.startDepthMeters).toBe(5);
        expect(waypoint.endDepthMeters).toBe(15);
        expect(waypoint.gasName).toBe(GasNames.nameFor(0.21, 0));
        expect(waypoint.swimAction).toBe(SwimAction.descent);
    });

    it('creates new WayPoint moving to level from segment', () => {
        const first = WayPoint.fromSegment(
            mockMetersUnits,
            makeSegment({ duration: 30, startDepth: 10, endDepth: 20 })
        );
        const levelSegment = makeSegment({
            duration: 60,
            startDepth: 20,
            endDepth: 20
        });

        const levelWaypoint = first.toLevel(levelSegment);

        expect(levelWaypoint.startTime).toBe(first.endTime);
        expect(levelWaypoint.endTime).toBe(first.endTime + levelSegment.duration);
        expect(levelWaypoint.startDepthMeters).toBe(first.endDepthMeters);
        expect(levelWaypoint.endDepthMeters).toBe(20);
        expect(levelWaypoint.swimAction).toBe(SwimAction.hover);
    });

    it('fits when actually fits', () => {
        const waypoint = WayPoint.fromSegment(
            mockMetersUnits,
            makeSegment({ duration: 60 }),
            10
        );

        expect(waypoint.fits(10)).toBeTrue();
        expect(waypoint.fits(30)).toBeTrue();
        expect(waypoint.fits(69.99)).toBeTrue();
    });

    it("doesn't fit when actually doesn't fit", () => {
        const waypoint = WayPoint.fromSegment(
            mockMetersUnits,
            makeSegment({ duration: 60 }),
            10
        );

        expect(waypoint.fits(9.99)).toBeFalse();
        expect(waypoint.fits(70)).toBeFalse();
    });

    it('updates swim action to hover', () => {
        const waypoint = WayPoint.fromSegment(
            mockMetersUnits,
            makeSegment({ startDepth: 10, endDepth: 10 })
        );

        expect(waypoint.swimAction).toBe(SwimAction.hover);
    });

    it('updates swim action to descent', () => {
        const waypoint = WayPoint.fromSegment(
            mockMetersUnits,
            makeSegment({ startDepth: 10, endDepth: 20 })
        );

        expect(waypoint.swimAction).toBe(SwimAction.descent);
    });

    it('updates swim action to ascent', () => {
        const waypoint = WayPoint.fromSegment(
            mockMetersUnits,
            makeSegment({ startDepth: 20, endDepth: 10 })
        );

        expect(waypoint.swimAction).toBe(SwimAction.ascent);
    });
});
