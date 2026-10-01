import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnitConversion } from '../../shared/UnitConversion';
import { GaslabelComponent } from './gaslabel.component';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { LanguageService } from '../../shared/language.service';

describe('Gas label component', () => {
    let component: GaslabelComponent;
    let fixture: ComponentFixture<GaslabelComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [ UnitConversion, provideTestTranslate(), LanguageService ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GaslabelComponent);
        component = fixture.componentInstance;
        // switched in shared settings, not on the component, to verify the units are not component scoped
        TestBed.inject(UnitConversion).imperialUnits = true;
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
