import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnitConversion } from '../shared/UnitConversion';
import { TankChartComponent } from './tank-chart.component';

describe('TankChartComponent', () => {
    let component: TankChartComponent;
    let fixture: ComponentFixture<TankChartComponent>;

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
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
