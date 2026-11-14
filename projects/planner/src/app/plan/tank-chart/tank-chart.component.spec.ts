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

    it('shows role label of rebreather tank', async () => {
        tank = new TankBound(Tank.createDefault(), units);
        fixture = await renderOnPush(TankChartComponent, { tank, roleLabel: 'Oxygen' });
        const role = (fixture.nativeElement as HTMLElement).querySelector(`#tankChartRole-${tank.id}`);
        expect(role?.textContent).toContain('Oxygen');
    });

    it('has no role label by default', async () => {
        tank = new TankBound(Tank.createDefault(), units);
        fixture = await renderOnPush(TankChartComponent, { tank });
        expect((fixture.nativeElement as HTMLElement).querySelector(`#tankChartRole-${tank.id}`)).toBeNull();
    });

    it('renders consumption changed outside Angular events', async () => {
        tank = new TankBound(Tank.createDefault(), units);
        fixture = await renderOnPush(TankChartComponent, { tank });
        expect(remainingText()).toContain('200/200');

        tank.assignConsumption(100, 50);
        await fixture.whenStable();

        expect(remainingText()).toContain('100/200');
    });

    describe('Legend markers and rock bottom line', () => {
        const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

        const renderConsumed = async (consumed: number, reserve: number): Promise<void> => {
            tank = new TankBound(Tank.createDefault(), units);
            tank.assignConsumption(consumed, reserve);
            fixture = await renderOnPush(TankChartComponent, { tank });
        };

        it('bars contain no numbers', async () => {
            await renderConsumed(100, 50);
            expect(host().querySelector('.progress')?.textContent?.trim()).toBe('');
        });

        it('shows remaining and rock bottom markers in bar colors', async () => {
            await renderConsumed(100, 50);
            const markers = host().querySelectorAll('.legend-marker');
            expect(markers.length).toBe(2);
            expect(markers[0].classList).toContain('bg-success');
            expect(markers[1].classList).toContain('legend-marker-reserve');
        });

        it('rock bottom marker has reserve line color and own size', async () => {
            await renderConsumed(0, 0);
            const marker = host().querySelector('.legend-marker-reserve') as HTMLElement;
            expect(getComputedStyle(marker).backgroundColor).toBe('rgb(255, 140, 0)');
            expect(marker.getBoundingClientRect().width).toBeGreaterThan(0);
        });

        it('remaining marker turns red when consumption changes outside Angular events', async () => {
            tank = new TankBound(Tank.createDefault(), units);
            fixture = await renderOnPush(TankChartComponent, { tank });

            tank.assignConsumption(180, 50);
            await fixture.whenStable();

            const remainingMarker = host().querySelectorAll('.legend-marker')[0];
            expect(remainingMarker.classList).toContain('bg-danger');
        });

        it('rock bottom line is thicker', async () => {
            await renderConsumed(100, 50);
            const line = host().querySelector('.reserve-bar') as HTMLElement;
            expect(getComputedStyle(line).borderRightWidth).toBe('4px');
        });

        it('rock bottom line is shortened to the chart frame', async () => {
            await renderConsumed(100, 50);
            const frame = host().querySelector('.gas-bar') as HTMLElement;
            const frameRect = frame.getBoundingClientRect();
            const lineRect = (host().querySelector('.reserve-bar') as HTMLElement).getBoundingClientRect();
            const border = parseFloat(getComputedStyle(frame).borderTopWidth);
            // spans the frame padding box: from inner top edge to inner bottom edge of the frame border
            expect(lineRect.top).toBeCloseTo(frameRect.top + border, 0);
            expect(lineRect.bottom).toBeCloseTo(frameRect.bottom - border, 0);
        });
    });

    it('renders start pressure changed outside Angular events', async () => {
        tank = new TankBound(Tank.createDefault(), units);
        fixture = await renderOnPush(TankChartComponent, { tank });

        tank.startPressure = 150;
        await fixture.whenStable();

        expect(remainingText()).toContain('/150');
    });
});
