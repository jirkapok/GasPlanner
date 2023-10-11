import { Component, ViewChild } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { MdbTabChange, MdbTabsComponent } from 'mdb-angular-ui-kit/tabs/tabs.component';
import { DiveSchedule, DivesSchedule } from '../shared/dives.schedule';

@Component({
    selector: 'app-plan-tabs',
    templateUrl: './plan.tabs.component.html',
    styleUrls: ['./plan.tabs.component.scss']
})
export class PlanTabsComponent {
    @ViewChild('tabs') public tabs: MdbTabsComponent | undefined;
    public addIcon = faPlus;

    public selected: DiveSchedule;

    constructor(public schedule: DivesSchedule) {
        this.selected = this.schedule.dives[0];
    }

    public closeTab(dive: DiveSchedule): void {
        this.schedule.remove(dive);
    }

    public addTab(): void {
        this.schedule.add();
    }

    public selectedChanged(e: MdbTabChange): void {
        let newIndex = e.index;
        if (e.index === this.schedule.dives.length) {
            newIndex = e.index - 1;
            this.tabs?.setActiveTab(newIndex);
        }

        this.selected = this.schedule.dives[newIndex];
    }
}
