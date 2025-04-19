import { UnitConversion } from './UnitConversion';
import { TanksService } from './tanks.service';
import { DepthsService } from './depths.service';
import { inject, TestBed } from '@angular/core/testing';
import { OptionsService } from './options.service';
import { DiveResults } from './diveresults';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';
import { HighestDensity } from "scuba-physics";

describe('Depths service', () => {
    let depthService: DepthsService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                UnitConversion, OptionsService,
                DepthsService, TanksService,
                DiveResults, ReloadDispatcher,
                DiveSchedules
            ]
        }).compileComponents();

        depthService = TestBed.inject(DepthsService);
    });

    describe('When NOT yet calculated', () => {
        // this value is used as minimum for simple profiles to be able descent
        // with default speed to default depth 30m.
        const descentOnly = 1.7;

        it('Max bottom time is NOT applied', () => {
            depthService.applyMaxDuration();
            expect(depthService.planDuration).toBe(descentOnly);
        });

        // Plan needs to be already calculated because NDL is needed
        it('No deco limit is NOT applied', () => {
            depthService.applyNdlDuration();
            expect(depthService.planDuration).toBe(descentOnly);
        });
    });

    describe('Apply plan limits', () => {
        const expectedDuration = 18;
        const expectedNdl = 12;
        beforeEach(() => {
            const diveResults = TestBed.inject(DiveResults);
            diveResults.updateDiveInfo(expectedNdl, false, 0,0,0,0,0,0,0, HighestDensity.createDefault(), [], [], []);
            diveResults.updateConsumption(expectedDuration, 0,0,0,0, false, false, []);
        });

        describe('When Calculated', () => {
            it('Max bottom time is applied', () => {
                depthService.applyMaxDuration();
                expect(depthService.planDuration).toBe(expectedDuration);
            });

            it('No deco limit is applied', () => {
                depthService.applyNdlDuration();
                expect(depthService.planDuration).toBe(expectedNdl);
            });
        });
    });

    describe('Depths', () => {
        let tanksService: TanksService;

        beforeEach(() => {
            tanksService = TestBed.inject(TanksService);
        });

        it('Add correct segment to the end', () => {
            depthService.addSegment();
            const added = depthService.segments[2];
            expect(added.endDepth).toBe(30);
            expect(added.duration).toBe(600);
        });

        it('Added segment has previous segment tank', () => {
            depthService.addSegment();
            tanksService.addTank();
            depthService.segments[2].tank = tanksService.tankData[1];
            depthService.addSegment();
            expect(depthService.segments[3].tank).toBe(tanksService.tankData[1]);
        });

        it('Remove first segment sets initial depth to 0m', () => {
            depthService.addSegment();
            const first = depthService.levels[0];
            depthService.removeSegment(first);
            const firstSegment = depthService.segments[0];
            expect(firstSegment.startDepth).toBe(0);
        });

        it('Remove middle segment corrects start depths', () => {
            depthService.segments[1].endDepth = 40;
            depthService.addSegment();
            const middleSegment = depthService.levels[1];
            depthService.removeSegment(middleSegment);
            const middle = depthService.segments[1];
            expect(middle.startDepth).toBe(30);
        });

        it('Remove Tank Updates segment reference to first tank', () => {
            tanksService.addTank();
            tanksService.addTank();
            const secondTank = tanksService.tanks[1];
            depthService.addSegment();
            const lastSegment = depthService.segments[1];
            lastSegment.tank = secondTank.tank;
            tanksService.removeTank(secondTank);

            expect(lastSegment.tank).toEqual(tanksService.firstTank.tank);
        });
    });

    describe('Imperial Units', () => {
        beforeEach(() => {
            const units = TestBed.inject(UnitConversion);
            units.imperialUnits = true;
        });

        it('Updates end depth', () => {
            const last = depthService.levels[1];
            last.endDepth = 70;
            const result = last.segment.endDepth;
            expect(result).toBeCloseTo(21.336, 6);
        });

        it('Converts start depth', () => {
            const last = depthService.levels[1];
            last.segment.startDepth = 6.096;
            expect(last.startDepth).toBeCloseTo(20, 6);
        });

        it('Adjusts tank label', () => {
            const last = depthService.levels[1];
            const tank = last.tank;
            tank.startPressure = 3000;
            tank.workingPressure = 3000;
            tank.size = 100;
            expect(last.tankLabel).toBe('1. Air/100/3000');
        });

        it('Defaults to 100 tf', inject(
            [DiveResults, TanksService, OptionsService],
            (dive: DiveResults, tanksService: TanksService, optionsService: OptionsService) => {
                const units = new UnitConversion();
                units.imperialUnits = true; // before the depths service was even created
                const sut = new DepthsService(units, tanksService, dive, optionsService, new ReloadDispatcher());
                expect(sut.plannedDepth).toBeCloseTo(100, 6);
            }));
    });
});
