import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiveIssuesComponent } from './dive-issues.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';

describe('DiveIssuesComponent', () => {
    let component: DiveIssuesComponent;
    let fixture: ComponentFixture<DiveIssuesComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveIssuesComponent],
            providers: [
                UnitConversion, DiveSchedules,
                ReloadDispatcher
            ]
        });
        fixture = TestBed.createComponent(DiveIssuesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
