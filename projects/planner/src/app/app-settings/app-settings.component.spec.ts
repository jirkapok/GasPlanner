import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Options } from 'scuba-physics';
import { OptionsDispatcherService } from '../shared/options-dispatcher.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { AppSettingsComponent } from './app-settings.component';

describe('App settings component', () => {
    let component: AppSettingsComponent;
    let fixture: ComponentFixture<AppSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AppSettingsComponent],
            providers: [WorkersFactoryCommon, UnitConversion,
                PlannerService, RouterTestingModule, OptionsDispatcherService],
            imports: [RouterTestingModule.withRoutes([])]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('Diver', () => {
        it('RMV applies to planner', inject([PlannerService],
            (planner: PlannerService) => {
                component.diver.rmv = 18;
                component.use();
                expect(planner.diver.rmv).toBe(18);
            }));

        it('ppO2 applies to planner', inject([OptionsDispatcherService],
            (options: OptionsDispatcherService) => {
                component.diver.maxPpO2 = 1.1;
                component.use();
                expect(options.maxPpO2).toBe(1.1);
            }));

        it('Deco ppO2 applies to planner', inject([OptionsDispatcherService],
            (options: OptionsDispatcherService) => {
                component.diver.maxDecoPpO2 = 1.5;
                component.use();
                expect(options.maxDecoPpO2).toBe(1.5);
            }));
    });

    // all options are still in metric
    describe('Imperial units', () => {
        let plannerOptions: Options;

        beforeEach(() => {
            const sourceOptions = TestBed.inject(OptionsDispatcherService);
            sourceOptions.altitude = 100;
            component.imperialUnits = true;
            component.use();
            plannerOptions = TestBed.inject(PlannerService).options;
        });

        it('Updates depth level options to 10 feet', () => {
            expect(plannerOptions.decoStopDistance).toBeCloseTo(3.048, 4);
            expect(plannerOptions.minimumAutoStopDepth).toBeCloseTo(10.0584, 4);
            expect(plannerOptions.lastStopDepth).toBeCloseTo(3.048, 4);
        });

        it('Rounds options feet', () => {
            expect(plannerOptions.maxEND).toBeCloseTo(29.8704, 4);
            expect(plannerOptions.altitude).toBeCloseTo(99.9744, 4);
            expect(plannerOptions.ascentSpeed50perc).toBeCloseTo(9.144, 4);
            expect(plannerOptions.ascentSpeed50percTo6m).toBeCloseTo(6.096, 4);
            expect(plannerOptions.ascentSpeed6m).toBeCloseTo(3.048, 4);
            expect(plannerOptions.descentSpeed).toBeCloseTo(17.9832, 4);
        });

        it('Rounds segments to feet', inject([PlannerService],
            (planner: PlannerService) => {
                const segment = planner.plan.segments[1];
                // 30 m flat segment rounded to 98 feet
                expect(segment.startDepth).toBeCloseTo(29.8704, 4);
                expect(segment.endDepth).toBeCloseTo(29.8704, 4);
            }));

        it('Rounds tank properties', inject([PlannerService],
            (planner: PlannerService) => {
                const tank = planner.firstTank;
                // 30 m flat segment rounded to 98 feet
                expect(tank.startPressure).toBeCloseTo(200.016909, 6);
                expect(tank.size).toBeCloseTo(15.05924, 5);
            }));
    });

    describe('Metric units', () => {
        let plannerOptions: Options;

        beforeEach(() => {
            const sourceOptions = TestBed.inject(OptionsDispatcherService);
            sourceOptions.altitude = 100;
            component.imperialUnits = false;
            component.use();
            plannerOptions = TestBed.inject(PlannerService).options;
        });

        it('Updates depth level options to 3 m', inject([PlannerService],
            (planner: PlannerService) => {
                component.imperialUnits = false;
                component.use();
                expect(planner.options.decoStopDistance).toBe(3);
                expect(planner.options.minimumAutoStopDepth).toBe(10);
                expect(planner.options.lastStopDepth).toBe(3);
            }));

        it('Rounds options meters', () => {
            expect(plannerOptions.maxEND).toBe(30);
            expect(plannerOptions.altitude).toBe(100);
            expect(plannerOptions.ascentSpeed50perc).toBe(9);
            expect(plannerOptions.ascentSpeed50percTo6m).toBe(6);
            expect(plannerOptions.ascentSpeed6m).toBe(3);
            expect(plannerOptions.descentSpeed).toBe(18);
        });

        it('Rounds segments to meters', inject([PlannerService],
            (planner: PlannerService) => {
                const segment = planner.plan.segments[1];
                // 30 m flat segment rounded to 98 feet
                expect(segment.startDepth).toBe(30);
                expect(segment.endDepth).toBe(30);
            }));

        it('Rounds tank properties without change', inject([PlannerService],
            (planner: PlannerService) => {
                const tank = planner.firstTank;
                // 30 m flat segment rounded to 98 feet
                expect(tank.startPressure).toBe(200);
                expect(tank.size).toBe(15);
            }));
    });
});
