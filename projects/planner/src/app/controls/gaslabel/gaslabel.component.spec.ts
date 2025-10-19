import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnitConversion } from '../../shared/UnitConversion';
import { GaslabelComponent } from './gaslabel.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe, NgIf } from '@angular/common';

describe('Gas label component', () => {
    let component: GaslabelComponent;
    let fixture: ComponentFixture<GaslabelComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [ UnitConversion ],
            imports: [
                CommonModule,
                ReactiveFormsModule,
                DecimalPipe, NgIf
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GaslabelComponent);
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        fixture.detectChanges();
    });

    describe('Imperial units', () => {
        it('Adjust mod', () => {
            expect(component.gasMod).toBeCloseTo(185, 5);
        });

        it('Adjust deco mod', () => {
            expect(component.gasDecoMod).toBeCloseTo(216, 5);
        });

        it('Adjust mnd', () => {
            expect(component.gasMnd).toBeCloseTo(98, 5);
        });
    });
});
