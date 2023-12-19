import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SurfaceIntervalComponent } from './surface-interval.component';
import { DiveSchedules } from '../shared/dive.schedules';
import { UnitConversion } from '../shared/UnitConversion';
import { ReloadDispatcher } from '../shared/reloadDispatcher';

describe('SurfaceIntervalComponent', () => {
    let component: SurfaceIntervalComponent;
    let fixture: ComponentFixture<SurfaceIntervalComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [SurfaceIntervalComponent],
            providers: [DiveSchedules, UnitConversion, ReloadDispatcher]
        });
        fixture = TestBed.createComponent(SurfaceIntervalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
