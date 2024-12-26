import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { InputControls } from '../../shared/inputcontrols';
import { OptionsService } from '../../shared/options.service';
import { UnitConversion } from '../../shared/UnitConversion';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { AltitudeComponent } from './altitude.component';

describe('Altitude', () => {
    let component: AltitudeComponent;
    let fixture: ComponentFixture<AltitudeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AltitudeComponent],
            providers: [UnitConversion, InputControls,
                OptionsService, ValidatorGroups,
                RouterTestingModule, DecimalPipe],
            imports: [
                RouterTestingModule.withRoutes([]),
                ReactiveFormsModule]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AltitudeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('Metric', () => {
        it('Get 300 m.a.s.l label', () => {
            expect(component.smallHill).toBe('300 m.a.s.l');
        });

        it('Get 800 m.a.s.l label', () => {
            expect(component.mountains).toBe('800 m.a.s.l');
        });

        it('Get 1500 m.a.s.l label', () => {
            expect(component.highMountains).toBe('1500 m.a.s.l');
        });

        it('Apply 300 m.a.s.l label', () => {
            component.setHill();
            expect(component.altitude).toBe(300);
        });

        it('Apply 800 m.a.s.l label', () => {
            component.setMountains();
            expect(component.altitude).toBe(800);
        });

        it('Apply 1500 m.a.s.l label', () => {
            component.setHighMountains();
            expect(component.altitude).toBe(1500);
        });
    });

    describe('Imperial', () => {
        beforeEach(() => {
            component.units.imperialUnits = true;
        });

        it('Get 1000 ft.a.s.l label', () => {
            expect(component.smallHill).toBe('1000 ft.a.s.l');
        });

        it('Get 2600 ft.a.s.l label', () => {
            expect(component.mountains).toBe('2600 ft.a.s.l');
        });

        it('Get 5000 ft.a.s.l label', () => {
            expect(component.highMountains).toBe('5000 ft.a.s.l');
        });

        it('Apply 1000 ft.a.s.l label', () => {
            component.setHill();
            expect(component.altitude).toBeCloseTo(304.8, 1);
        });

        it('Apply 2600 ft.a.s.l label', () => {
            component.setMountains();
            expect(component.altitude).toBeCloseTo(792.48, 2);
        });

        it('Apply 5000 ft.a.s.l label', () => {
            component.setHighMountains();
            expect(component.altitude).toBe(1524);
        });
    });
});
