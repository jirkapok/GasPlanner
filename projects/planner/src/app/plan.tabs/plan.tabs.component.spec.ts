import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanTabsComponent } from './plan.tabs.component';
import { DivesSchedule } from '../shared/dives.schedule';
import { UnitConversion } from '../shared/UnitConversion';

describe('PlanTabsComponent', () => {
    let component: PlanTabsComponent;
    let fixture: ComponentFixture<PlanTabsComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [PlanTabsComponent],
            providers: [
                DivesSchedule, UnitConversion,
            ]
        });
        fixture = TestBed.createComponent(PlanTabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
