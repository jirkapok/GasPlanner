import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { SurfaceIntervalComponent } from './surface-interval.component';
import { DiveSchedules } from '../shared/dive.schedules';
import { UnitConversion } from '../shared/UnitConversion';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { InputControls } from '../shared/inputcontrols';
import { ValidatorGroups } from '../shared/ValidatorGroups';

describe('SurfaceIntervalComponent', () => {
    let component: SurfaceIntervalComponent;
    let fixture: ComponentFixture<SurfaceIntervalComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ SurfaceIntervalComponent ],
            providers: [
                DiveSchedules, UnitConversion, DecimalPipe,
                ReloadDispatcher, InputControls, ValidatorGroups
            ]
        });
        fixture = TestBed.createComponent(SurfaceIntervalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
