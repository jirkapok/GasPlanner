import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileDifferenceChartComponent } from './diff-profilechart.component';

describe('ProfileDifferenceChartComponent', () => {
    let component: ProfileDifferenceChartComponent;
    let fixture: ComponentFixture<ProfileDifferenceChartComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ProfileDifferenceChartComponent]
        });
        fixture = TestBed.createComponent(ProfileDifferenceChartComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
