import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { PlannerService } from '../shared/planner.service';
import { UnitConversion } from '../shared/UnitConversion';
import { GaslabelComponent } from './gaslabel.component';

describe('Gas label component', () => {
    let component: GaslabelComponent;
    let fixture: ComponentFixture<GaslabelComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GaslabelComponent],
            providers: [UnitConversion, PlannerService],
            imports: []
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GaslabelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Imperial units adjusts mod', inject([UnitConversion],
        (units: UnitConversion) => {
            units.imperialUnits = true;
            expect(component.gasMod).toBeCloseTo(189.10761, 5);
        }));

    it('Imperial units adjusts deco mod', inject([UnitConversion],
        (units: UnitConversion) => {
            units.imperialUnits = true;
            expect(component.gasDecoMod).toBeCloseTo(216.53543, 5);
        }));

    it('Imperial units adjusts mnd', inject([UnitConversion],
        (units: UnitConversion) => {
            units.imperialUnits = true;
            expect(component.gasMnd).toBeCloseTo(98.42520, 5);
        }));
});
