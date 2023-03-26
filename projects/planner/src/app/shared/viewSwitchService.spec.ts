import { TestBed } from '@angular/core/testing';
import { Plan } from './plan.service';
import { TanksService } from './tanks.service';
import { ViewSwitchService } from './viewSwitchService';
import { UnitConversion } from './UnitConversion';
import { OptionsService } from './options.service';

describe('View Switch service', () => {
    const o2Expected = 50;
    let tanksService: TanksService;
    let plan: Plan;
    let viewSwitch: ViewSwitchService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                TanksService, ViewSwitchService,
                OptionsService, UnitConversion,
                Plan
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
        tanksService = TestBed.inject(TanksService);
        tanksService.firstTank.o2 = o2Expected;
        tanksService.addTank();

        const firstTank = tanksService.firstTank.tank;
        const options = TestBed.inject(OptionsService);
        plan = TestBed.inject(Plan);
        plan.setSimple(7, 12, firstTank,  options.getOptions());
        plan.segments[1].endDepth = 5;
        plan.addSegment(firstTank);

        viewSwitch = TestBed.inject(ViewSwitchService);
        viewSwitch.isComplex = true; // because default value is false
    });

    describe('Switch to simple view', () => {
        beforeEach(() => {
            viewSwitch.isComplex = false;
        });

        it('Sets simple profile', () => {
            expect(plan.duration).toBe(22);
        });

        it('Plan has correct depths', () => {
            const segments = plan.segments;
            expect(segments.length).toBe(2);
            expect(segments[0].endDepth).toBe(7);
            expect(segments[1].endDepth).toBe(7);
        });
    });

    it('Fires event when value not changed', () => {
        let firedTimes = 0;
        viewSwitch.viewSwitched.subscribe(() => firedTimes++);
        viewSwitch.isComplex = false;
        viewSwitch.isComplex = false;
        expect(firedTimes).toBe(2);
    });
});
