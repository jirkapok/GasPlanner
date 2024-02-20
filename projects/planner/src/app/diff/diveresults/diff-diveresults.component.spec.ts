import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DiveResultsDifferenceComponent} from './diff-diveresults.component';

describe('DiveResultsDifferenceComponent', () => {
    let component: DiveResultsDifferenceComponent;
    let fixture: ComponentFixture<DiveResultsDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveResultsDifferenceComponent]
        });
        fixture = TestBed.createComponent(DiveResultsDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
