import { Segment } from 'scuba-physics';
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
            const last = planner.plan.segments[planner.plan.length - 1];
            last.endDepth = 40;
            planner.plan.fixDepths();
            planner.resetToSimple();
        });

        it('Sets simple profile', () => {
            expect(planner.plan.duration).toBe(22);
        });

        it('Plan has correct depths', () => {
            const segments = planner.plan.segments;
            expect(segments.length).toBe(2);
            expect(segments[0].endDepth).toBe(40);
            expect(segments[1].endDepth).toBe(40);
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

    describe('Max narcotic depth', ()=>{
        it('Is calculated 30 m for Air with 30m max. narcotic depth option', ()=> {
            const result = planner.maxNarcDepth;
            expect(result).toBe(30);
        });

        it('Is calculated as MOD for EAN50', ()=> {
            planner.firstTank.gas.fO2 = 0.5;
            const result = planner.maxNarcDepth;
            expect(result).toBe(18);
        });
    });

    describe('Manage tanks', ()=> {
        it('Added tank receives ID', ()=> {
            planner.addTank();
            const count = planner.tanks.length;
            const added = planner.tanks[count - 1];

            expect(added.id).toEqual(2);
        });

        describe('Remove', ()=> {
            let lastSegment: Segment;

            beforeEach(() => {
                planner.addTank();
                planner.addTank();
                const secondTank = planner.tanks[1];
                planner.addSegment();
                const segments = planner.plan.segments;
                lastSegment = segments[1];
                lastSegment.tank = secondTank;
                planner.removeTank(secondTank);
            });


            it('Updates segment reference to first tank', ()=> {
                expect(lastSegment.tank).toEqual(planner.firstTank);
            });

            it('Tank ids are updated', ()=> {
                const secondTank = planner.tanks[1];
                expect(secondTank.id).toEqual(2);
            });
        });
    });

    describe('Apply plan limits', ()=>{
        // Needs to be already calculated because NDL is needed
        describe('When NOT yet calculated', () => {
            // this value is used as minimum for simple profiles to be able descent
            // with default speed to default depth 30m.
            const descentOnly = 1.5;

            it('Max bottom time is NOT applied', ()=> {
                planner.applyMaxDuration();
                expect(planner.plan.duration).toBe(descentOnly);
            });

            it('No deco limit is NOT applied', ()=> {
                planner.applyNdlDuration();
                expect(planner.plan.duration).toBe(descentOnly);
            });
        });

        describe('When Calculated', () => {
            it('Max bottom time is applied', ()=> {
                planner.calculate();
                planner.applyMaxDuration();
                expect(planner.plan.duration).toBe(17);
            });

            it('No deco limit is applied', ()=> {
                planner.calculate();
                planner.applyNdlDuration();
                expect(planner.plan.duration).toBe(12);
            });
        });

        it('Max narcotic depth is applied', ()=> {
            planner.firstTank.gas.fO2 = 0.5;
            planner.applyMaxDepth();
            expect(planner.plan.maxDepth).toBe(18);
        });
    });
});
