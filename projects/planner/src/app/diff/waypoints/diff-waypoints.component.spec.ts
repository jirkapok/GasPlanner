import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WaypointsDifferenceComponent} from './diff-waypoints.component';
import {UnitConversion} from '../../shared/UnitConversion';
import {TestData} from '../diff.component';

describe('WaypointsDifferenceComponent', () => {
    let component: WaypointsDifferenceComponent;
    let fixture: ComponentFixture<WaypointsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaypointsDifferenceComponent],
            providers: [UnitConversion]
        });
        fixture = TestBed.createComponent(WaypointsDifferenceComponent);
        component = fixture.componentInstance;
        component.data = new TestData();
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
