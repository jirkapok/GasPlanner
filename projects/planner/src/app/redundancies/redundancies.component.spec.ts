import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedundanciesComponent } from './redundancies.component';
import { UnitConversion } from '../shared/UnitConversion';
import {ValidatorGroups} from '../shared/ValidatorGroups';
import {InputControls} from '../shared/inputcontrols';
import {DecimalPipe} from '@angular/common';

describe('RedundanciesComponent', () => {
    let component: RedundanciesComponent;
    let fixture: ComponentFixture<RedundanciesComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [RedundanciesComponent],
            providers: [
                UnitConversion, ValidatorGroups, InputControls,
                DecimalPipe
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
