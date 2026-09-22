import { Component, ChangeDetectionStrategy } from '@angular/core';
import {DiveSchedules} from '../../shared/dive.schedules';
import { ReactiveFormsModule } from '@angular/forms';

import { DiffTabsButtonComponent } from './profile-button/diff-tabs-button.component';

@Component({
    selector: 'app-diff-tabs',
    templateUrl: './diff-tabs.component.html',
    styleUrls: ['./diff-tabs.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ReactiveFormsModule, DiffTabsButtonComponent]
})
export class DiffTabsComponent {
    constructor(public schedules: DiveSchedules) {
    }

}
