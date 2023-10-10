import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiveIssuesComponent } from './dive-issues.component';
import { Plan } from '../shared/plan.service';
import { UnitConversion } from '../shared/UnitConversion';
import { DiveResults } from '../shared/diveresults';

describe('DiveIssuesComponent', () => {
    let component: DiveIssuesComponent;
    let fixture: ComponentFixture<DiveIssuesComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveIssuesComponent],
            providers: [
                DiveResults, UnitConversion, Plan
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
