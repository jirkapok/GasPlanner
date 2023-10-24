import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedundanciesComponent } from './redundancies.component';
import { UnitConversion } from '../shared/UnitConversion';

describe('RedundanciesComponent', () => {
    let component: RedundanciesComponent;
    let fixture: ComponentFixture<RedundanciesComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [RedundanciesComponent],
            providers: [
                UnitConversion
            ]
        });
        fixture = TestBed.createComponent(RedundanciesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
