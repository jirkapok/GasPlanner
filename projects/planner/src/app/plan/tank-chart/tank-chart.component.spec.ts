import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tank } from 'scuba-physics';
import { TankChartComponent } from './tank-chart.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { TankBound } from '../../shared/models';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';
import { LanguageService } from '../../shared/language.service';

describe('TankChartComponent', () => {
    let component: TankChartComponent;
    let fixture: ComponentFixture<TankChartComponent>;
    let units: UnitConversion;
    let tank: TankBound;

    const remainingText = (): string | null | undefined =>
        (fixture.nativeElement as HTMLElement).querySelector('small.text-start')?.textContent;

    beforeEach(() => {
        units = new UnitConversion();
        TestBed.configureTestingModule({
            imports: [TankChartComponent],
            providers: [{ provide: UnitConversion, useValue: units }, provideTestTranslate(), LanguageService]
        });
    });

    describe('Imperial units', () => {
        beforeEach(async () => {
            units.imperialUnits = true;
            tank = new TankBound(Tank.createDefault(), units);
            tank.assignConsumption(100, 50);
            fixture = await renderOnPush(TankChartComponent, { tank });
            component = fixture.componentInstance;
        });

        it('Start pressure is converted', () => {
            expect(component.startPressure).toBeCloseTo(2900.755, 3);
        });

        it('End pressure is converted', () => {
            expect(component.endPressure).toBeCloseTo(1450.377, 3);
        });

        it('Reserve is converted', () => {
            expect(component.reserve).toBeCloseTo(725.189, 3);
        });
    });

    it('renders consumption changed outside Angular events', async () => {
        tank = new TankBound(Tank.createDefault(), units);
        fixture = await renderOnPush(TankChartComponent, { tank });
        expect(remainingText()).toContain('200/200');

        tank.assignConsumption(100, 50);
        await fixture.whenStable();

        expect(remainingText()).toContain('100/200');
    });
});
