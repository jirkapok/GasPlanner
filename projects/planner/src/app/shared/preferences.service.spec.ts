import { TestBed, inject } from '@angular/core/testing';
import { PreferencesService } from './preferences.service';
import { PlannerService } from './planner.service';
import { Diver, Options, Tank, Salinity } from 'scuba-physics';
import { OptionExtensions } from '../../../../scuba-physics/src/lib/Options.spec';

describe('PreferencesService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PreferencesService, PlannerService]
        });

        localStorage.clear();
    });

    it('loads saved disclaimer', inject([PreferencesService, PlannerService],
        (service: PreferencesService, planner: PlannerService) => {
            service.disableDisclaimer();
            const enabled = service.disclaimerEnabled();
            expect(enabled).toBeFalsy();
        }));

    describe('Preferences', () => {
        it('Diver values are loaded after save', inject([PreferencesService, PlannerService],
            (service: PreferencesService, planner: PlannerService) => {
                const diver = planner.diver;
                diver.rmv = 10;
                diver.maxPpO2 = 1.1;
                diver.maxDecoPpO2 = 1.5;
                planner.calculate();
                service.saveDefaults();

                diver.rmv = 10;
                diver.maxPpO2 = 1.3;
                diver.maxDecoPpO2 = 1.4;
                service.loadDefaults();

                const expected = new Diver(10, 1.1);
                expected.maxDecoPpO2 = 1.5;
                expect(diver).toEqual(expected);
            }));

        it('Options values are loaded after save', inject([PreferencesService, PlannerService],
            (service: PreferencesService, planner: PlannerService) => {
                const options = planner.options;
                // not going to test all options, since it is a flat structure
                options.gfLow = 0.3;
                options.descentSpeed = 15;
                planner.calculate();
                service.saveDefaults();

                options.gfLow = 0.35;
                options.descentSpeed = 17;
                service.loadDefaults();

                const expected = new Options(0.3, 0.85, 1.4, 1.6, Salinity.fresh);
                expected.descentSpeed = 15;
                expected.addSafetyStop = true;
                expect(planner.options).toEqual(expected);
            }));

        it('Tanks are loaded after save', inject([PreferencesService, PlannerService],
            (service: PreferencesService, planner: PlannerService) => {
                OptionExtensions.applySimpleSpeeds(planner.options);
                const tanks = planner.tanks;
                planner.addTank();
                tanks[0].startPressure = 150;
                tanks[1].o2 = 50;
                planner.calculate();
                service.saveDefaults();

                tanks[0].startPressure = 130;
                tanks[1].o2 = 32;
                service.loadDefaults();

                const expected1 = new Tank(15, 150, 21);
                expected1.id = 1;
                expected1.consumed = 66;
                expected1.reserve = 45;
                const expected2 = new Tank(11, 200, 50);
                expected2.id = 2;
                expected2.consumed = 21;
                expected2.reserve = 62;
                // JSON serialization prevents order of items in an array
                const expected: Tank[] = [ expected1, expected2 ];
                expect(planner.tanks).toEqual(expected);
            }));

        it('Plan is loaded after save', inject([PreferencesService, PlannerService],
            (service: PreferencesService, planner: PlannerService) => {
                const plan = planner.plan;
                planner.addTank();
                planner.addTank();
                planner.addSegment();
                const lastSegment = plan.segments[2];
                const secondTank = planner.tanks[1];
                lastSegment.tank =secondTank;
                planner.calculate();
                service.saveDefaults();

                planner.removeSegment(lastSegment);
                planner.removeTank(secondTank);
                service.loadDefaults();

                expect(planner.tanks.length).toEqual(3);
                expect(planner.plan.length).toEqual(3);
                expect(planner.plan.segments[2].tank?.id).toEqual(2);
            }));
    });
});
