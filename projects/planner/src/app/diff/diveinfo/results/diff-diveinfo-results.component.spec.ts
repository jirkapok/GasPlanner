import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DiveInfoResultsDifferenceComponent} from './diff-diveinfo-results.component';

describe('DiveInfoResultsDifferenceComponent', () => {
    let component: DiveInfoResultsDifferenceComponent;
    let fixture: ComponentFixture<DiveInfoResultsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveInfoResultsDifferenceComponent]
        });
        fixture = TestBed.createComponent(DiveInfoResultsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
