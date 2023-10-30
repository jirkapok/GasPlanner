import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WaypointsDifferenceComponent} from './diff-waypoints.component';
import {UnitConversion} from '../../shared/UnitConversion';
import {SelectedWaypoint} from '../../shared/selectedwaypointService';
import {DiveResults} from '../../shared/diveresults';

describe('WaypointsDifferenceComponent', () => {
    let component: WaypointsDifferenceComponent;
    let fixture: ComponentFixture<WaypointsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaypointsDifferenceComponent],
            providers: [UnitConversion, SelectedWaypoint, DiveResults]
        });
        fixture = TestBed.createComponent(WaypointsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
