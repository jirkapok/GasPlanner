import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsumedGas, StandardGases } from 'scuba-physics';
import { GasChartComponent } from './gas-chart.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { LanguageService } from '../../shared/language.service';

describe('GasChartComponent', () => {
    let component: GasChartComponent;
    let fixture: ComponentFixture<GasChartComponent>;

    const render = (total: number, consumed: number, reserve: number): void => {
        const air = StandardGases.air.copy();
        component.consumed = new ConsumedGas(air, total, consumed, reserve);
        fixture.detectChanges();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GasChartComponent],
            providers: [UnitConversion, provideTestTranslate(), LanguageService]
        }).compileComponents();

        fixture = TestBed.createComponent(GasChartComponent);
        component = fixture.componentInstance;
    });

    describe('Metric units', () => {
        beforeEach(() => {
            render(3000, 1500, 500);
        });

        it('Shows values in liters', () => {
            expect(component.reserve).toBeCloseTo(500, 6);
            expect(component.consumedVolume).toBeCloseTo(1500, 6);
            expect(component.available).toBeCloseTo(3000, 6);
        });
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            component.units.imperialUnits = true;
            render(3000, 1500, 500);
        });

        it('Values are converted to cubic feet', () => {
            expect(component.reserve).toBeCloseTo(17.657, 3);
            expect(component.consumedVolume).toBeCloseTo(52.972, 3);
            expect(component.available).toBeCloseTo(105.944, 3);
        });
    });
});
