import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NdlService } from '../shared/ndl.service';
import { UnitConversion } from '../shared/UnitConversion';
import { NdlLimitsComponent } from './ndl-limits.component';

describe('NdlLimits component', () => {
    let component: NdlLimitsComponent;
    let fixture: ComponentFixture<NdlLimitsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NdlLimitsComponent],
            providers: [FormsModule, UnitConversion, NdlService],
            imports: [RouterTestingModule.withRoutes([])]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NdlLimitsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Imperial units adjusts calculated depths to feet', inject([UnitConversion],
        (units: UnitConversion) => {
            units.imperialUnits = true;
            component.calculate();
            expect(component.limits[0].depth).toBe(40);
        }));

    it('Change of max ppO2 causes mod for limits', () => {
        component.options.maxPpO2 = 1;
        component.calculate();
        const lastIndex = component.limits.length - 1;
        expect(component.limits[lastIndex].depth).toBe(36);
    });

    it('No limits found', () => {
        component.tank.o2 = 100;
        component.calculate();
        expect(component.noResults).toBeTruthy();
    });
});
