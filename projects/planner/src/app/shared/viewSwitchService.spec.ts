import { inject, TestBed } from '@angular/core/testing';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';
import { UnitConversion } from './UnitConversion';
import { DepthsService } from './depths.service';
import { ReloadDispatcher } from './reloadDispatcher';
import { DiveSchedules } from './dive.schedules';

describe('View Switch service', () => {
    const o2Expected = 50;
    let tanksService: TanksService;
    let viewSwitch: ViewSwitchService;
    let plan: DepthsService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                ViewSwitchService, UnitConversion,
                DiveSchedules, ReloadDispatcher
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
        const selectedDive = TestBed.inject(DiveSchedules).selected;
        tanksService = selectedDive.tanksService;
        tanksService.firstTank.o2 = o2Expected;
        tanksService.addTank();

        plan = selectedDive.depths;
        plan.plannedDepth = 7;
        plan.setSimple();
        plan.segments[1].endDepth = 5;
        plan.addSegment();

        viewSwitch = TestBed.inject(ViewSwitchService);
        viewSwitch.isComplex = true; // because default value is false
    });

    describe('Switch to simple view', () => {
        it('Sets simple profile', () => {
            viewSwitch.isComplex = false;
            expect(plan.planDuration).toBe(22);
        });

        it('Plan has correct depths', () => {
            viewSwitch.isComplex = false;
            const segments = plan.segments;
            expect(segments.length).toBe(2);
            expect(segments[0].endDepth).toBe(7);
            expect(segments[1].endDepth).toBe(7);
        });

        it('Sets simple profile to all dives', inject([DiveSchedules], (schedules: DiveSchedules) => {
            schedules.add();
            const schedulesSpy = spyOn(schedules, 'setSimple');
            viewSwitch.isComplex = false;

            expect(schedulesSpy).toHaveBeenCalledWith();
        }));
    });
});
