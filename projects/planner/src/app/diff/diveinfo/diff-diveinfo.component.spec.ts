import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DiveInfoDifferenceComponent} from './diff-diveinfo.component';

describe('DiveInfoDifferenceComponent', () => {
    let component: DiveInfoDifferenceComponent;
    let fixture: ComponentFixture<DiveInfoDifferenceComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveInfoDifferenceComponent]
        });
        fixture = TestBed.createComponent(DiveInfoDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
