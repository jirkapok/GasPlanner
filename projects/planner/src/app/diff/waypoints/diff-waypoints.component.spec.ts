import {ComponentFixture, TestBed} from '@angular/core/testing';
import {WaypointsDifferenceComponent} from './diff-waypoints.component';

describe('ProfilechartComponent', () => {
    let component: WaypointsDifferenceComponent;
    let fixture: ComponentFixture<WaypointsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaypointsDifferenceComponent]
        });
        fixture = TestBed.createComponent(WaypointsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
