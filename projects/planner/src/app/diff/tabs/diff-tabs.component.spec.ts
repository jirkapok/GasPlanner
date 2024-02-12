import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiffTabsComponent } from './diff-tabs.component';
import {DiveSchedules} from '../../shared/dive.schedules';
import {UnitConversion} from '../../shared/UnitConversion';
import {ReloadDispatcher} from '../../shared/reloadDispatcher';

describe('DiffTabsComponent', () => {
    let component: DiffTabsComponent;
    let fixture: ComponentFixture<DiffTabsComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiffTabsComponent],
            providers: [
                DiveSchedules,
                UnitConversion,
                ReloadDispatcher
            ]

        });
        fixture = TestBed.createComponent(DiffTabsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
