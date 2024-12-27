import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tank } from 'scuba-physics';
import { TankChartComponent } from './tank-chart.component';
import { UnitConversion } from '../../shared/UnitConversion';

describe('TankChartComponent', () => {
    let component: TankChartComponent;
    let fixture: ComponentFixture<TankChartComponent>;
    let tank: Tank;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TankChartComponent],
            providers: [UnitConversion]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TankChartComponent);
        component = fixture.componentInstance;
        component.units.imperialUnits = true;
        tank = component.tank;
        tank.reserve = 50;
        tank.consumed = 100;
        fixture.detectChanges();
    });

    describe('Imperial units', () => {
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
});
