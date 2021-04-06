import { PlannerService } from './planner.service';

describe('PlannerService', () => {
    let planner: PlannerService;

    beforeEach(() => {
        planner = new PlannerService();
    });

    describe('no deco limit', () => {
        it('is calculated', () => {
            const noDecoLimit = planner.noDecoTime();
            expect(noDecoLimit).toBe(12);
        });
    });

    describe('30m for 15 minutes Calculates (defaults)', () => {
        it('8 minutes time to surface', () => {
            planner.calculate();
            expect(planner.dive.timeToSurface).toBe(8);
        });

        it('22 minutes maximum dive time', () => {
            planner.calculate();
            expect(planner.dive.maxTime).toBe(17);
        });

        it('74 bar rock bottom', () => {
            planner.calculate();
            expect(planner.firstTank.reserve).toBe(78);
        });

        it('109 bar remaining gas', () => {
            planner.calculate();
            expect(planner.firstTank.endPressure).toBe(124);
        });
    });

    describe('Shows errors', () => {
        it('60m for 50 minutes maximum depth exceeded', () => {
            planner.assignDepth(60);
            planner.calculate();
            const hasEvents = planner.dive.events.length > 0;
            expect(hasEvents).toBeTruthy();
        });

        it('60m for 50 minutes not enough gas', () => {
            planner.assignDuration(50);
            planner.calculate();
            expect(planner.dive.notEnoughGas).toBeTruthy();
        });

        it('30m for 20 minutes no decompression time exceeded', () => {
            planner.assignDuration(20);
            planner.calculate();
            expect(planner.dive.noDecoExceeded).toBeTruthy();
        });
    });

    describe('Switch between simple and complex', () => {
        const o2Expected = 50;

        beforeEach(() => {
            planner.firstTank.o2 = o2Expected;
            planner.addTank();
            planner.addSegment();
            planner.resetToSimple();
        });

        it('Sets simple profile', () => {
            expect(planner.plan.duration).toBe(12);
        });

        it('Plan has correct depths', () => {
            const segments = planner.plan.segments;
            expect(segments.length).toBe(2);
            expect(segments[0].endDepth).toBe(30);
            expect(segments[1].endDepth).toBe(30);
        });

        it('Resets gases to one only', () => {
            expect(planner.tanks.length).toBe(1);
        });

        it('Keeps first gas content', () => {
            expect(planner.firstTank.o2).toBe(o2Expected);
        });
    });

    describe('Depths', () => {
        it('Add correct segment to the end', () => {
            planner.addSegment();
            const added = planner.plan.segments[2];
            expect(added.endDepth).toBe(30);
            expect(added.duration).toBe(600);
            expect(added.tank).toBe(planner.firstTank);
        });

        it('Remove first segment sets initial depth to 0m', () => {
            planner.addSegment();
            let first = planner.plan.segments[0];
            planner.removeSegment(first);
            first = planner.plan.segments[0];
            expect(first.startDepth).toBe(0);
        });

        it('Remove middle segment corrects start depths', () => {
            planner.plan.segments[1].endDepth = 40;
            planner.addSegment();
            let middle = planner.plan.segments[1];
            planner.removeSegment(middle);
            middle = planner.plan.segments[1];
            expect(middle.startDepth).toBe(30);
        });
    });
});
