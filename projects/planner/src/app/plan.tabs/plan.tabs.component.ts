import { Component, ViewChild } from '@angular/core';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { MdbTabChange, MdbTabsComponent } from 'mdb-angular-ui-kit/tabs/tabs.component';

@Component({
  selector: 'app-plan-tabs',
  templateUrl: './plan.tabs.component.html',
  styleUrls: ['./plan.tabs.component.scss']
})
export class PlanTabsComponent {
    @ViewChild('tabs') public tabs: MdbTabsComponent | undefined;
    public addIcon = faPlus;
    public tabNames: string[] = ['First', 'Second', 'Third'];
    public selectedTab = 'First';

    public closeTab(index: number): void {
        this.tabNames.splice(index, 1);
        const newIndex = index === 0 ? 0 : index - 1;
        // this.tabs?.setActiveTab(newIndex);
    }

    public addTab(): void {
        const newName = `Dive ${this.tabNames.length}`;
        this.tabNames.push(newName);
        // this.tabs?.setActiveTab(this.tabNames.length - 1);
    }

    public selectedChanged(e: MdbTabChange): void {
        let newIndex = e.index;
        if(e.index === this.tabNames.length) {
            newIndex = e.index - 1;
            this.tabs?.setActiveTab(newIndex);
        }

        this.selectedTab = this.tabNames[newIndex];
    }
}
