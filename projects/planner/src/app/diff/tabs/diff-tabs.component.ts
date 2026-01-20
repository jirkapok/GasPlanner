import { Component } from '@angular/core';
import {DiveSchedules} from '../../shared/dive.schedules';
import { ReactiveFormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { DiffTabsButtonComponent } from './profile-button/diff-tabs-button.component';

@Component({
    selector: 'app-diff-tabs',
    templateUrl: './diff-tabs.component.html',
    styleUrls: ['./diff-tabs.component.scss'],
    imports: [ReactiveFormsModule, NgFor, DiffTabsButtonComponent]
})
export class DiffTabsComponent {
    constructor(public schedules: DiveSchedules) {
    }

}
