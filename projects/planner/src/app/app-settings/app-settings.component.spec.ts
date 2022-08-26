import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
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

    it('Metric units updates depth level options', inject([PlannerService],
        (planner: PlannerService) => {
            component.imperialUnits = false;
            component.use();
            expect(planner.options.decoStopDistance).toBe(3);
            expect(planner.options.minimumAutoStopDepth).toBe(10);
            expect(planner.options.lastStopDepth).toBe(3);
        }));

    it('Imperial units updates depth level options', inject([PlannerService],
        (planner: PlannerService) => {
            component.imperialUnits = true;
            component.use();
            // all options are still in metric
            expect(planner.options.decoStopDistance).toBeCloseTo(3.048, 4);
            expect(planner.options.minimumAutoStopDepth).toBeCloseTo(10.0584, 4);
            expect(planner.options.lastStopDepth).toBeCloseTo(3.048, 4);
        }));
});
