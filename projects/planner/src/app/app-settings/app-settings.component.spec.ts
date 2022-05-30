import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PlannerService } from '../shared/planner.service';
import { UnitConversion } from '../shared/UnitConversion';
import { AppSettingsComponent } from './app-settings.component';

describe('App settings component', () => {
    let component: AppSettingsComponent;
    let fixture: ComponentFixture<AppSettingsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AppSettingsComponent],
            providers: [UnitConversion, PlannerService, RouterTestingModule],
            imports: [RouterTestingModule.withRoutes([])]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AppSettingsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Metric units updates depth level options', inject([PlannerService],
        (planner: PlannerService) => {
            component.imperialUnits = false;
            component.use();
            expect(planner.options.decoStopDistance).toBe(3);
            expect(planner.options.minimumAutoStopDepth).toBe(10);
            expect(planner.options.lastStopDepth).toBe(3);
        }));

    xit('Imperial units updates depth level options', inject([PlannerService],
        (planner: PlannerService) => {
            component.imperialUnits = true;
            component.use();
            expect(planner.options.decoStopDistance).toBe(10);
            expect(planner.options.minimumAutoStopDepth).toBe(33);
            expect(planner.options.lastStopDepth).toBe(10);
        }));
});
