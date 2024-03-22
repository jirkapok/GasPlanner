import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiffTabsButtonComponent } from './diff-tabs-button.component';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { DiveSchedules } from '../../../shared/dive.schedules';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ReloadDispatcher } from '../../../shared/reloadDispatcher';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('DiffTabsButtonComponent', () => {
    let component: DiffTabsButtonComponent;
    let fixture: ComponentFixture<DiffTabsButtonComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserAnimationsModule],
            declarations: [DiffTabsButtonComponent],
            providers: [
                ProfileComparatorService,
                DiveSchedules,
                UnitConversion,
                ReloadDispatcher
            ]
        });
        fixture = TestBed.createComponent(DiffTabsButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
