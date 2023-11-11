import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiveIssuesComponent } from './dive-issues.component';
import { UnitConversion } from '../shared/UnitConversion';
import { DiveResults } from '../shared/diveresults';
import {DepthsService} from '../shared/depths.service';
import {TanksService} from '../shared/tanks.service';
import {OptionsService} from '../shared/options.service';
import {ReloadDispatcher} from '../shared/reloadDispatcher';

describe('DiveIssuesComponent', () => {
    let component: DiveIssuesComponent;
    let fixture: ComponentFixture<DiveIssuesComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiveIssuesComponent],
            providers: [
                OptionsService, UnitConversion,
                TanksService, DiveResults,
                DepthsService, ReloadDispatcher
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
