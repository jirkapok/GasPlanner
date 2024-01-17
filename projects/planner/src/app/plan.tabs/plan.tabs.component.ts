import { Component, ViewChild } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { MdbTabChange, MdbTabsComponent } from 'mdb-angular-ui-kit/tabs/tabs.component';
import { DiveSchedule } from '../shared/dive.schedules';
import { ManagedDiveSchedules } from '../shared/managedDiveSchedules';

@Component({
    selector: 'app-plan-tabs',
    templateUrl: './plan.tabs.component.html',
    styleUrls: ['./plan.tabs.component.scss']
})
export class PlanTabsComponent {
    @ViewChild('tabs') public tabs: MdbTabsComponent | undefined;
    public addIcon = faPlus;

    constructor(public schedules: ManagedDiveSchedules) { }

    public closeTab(dive: DiveSchedule): void {
        this.schedules.remove(dive);
    }

    public addTab(): void {
        this.schedules.add();
    }

    public selectedChanged(e: MdbTabChange): void {
        let newIndex = e.index;
        if (e.index === this.schedules.length) {
            newIndex = e.index - 1;
            this.tabs?.setActiveTab(newIndex);
        }

        this.schedules.select(newIndex);
    }
}
