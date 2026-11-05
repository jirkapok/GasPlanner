import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { faPlus, faRotate } from '@fortawesome/free-solid-svg-icons';
import { MdbTabChange, MdbTabsComponent } from 'mdb-angular-ui-kit/tabs';
import { merge, takeUntil } from 'rxjs';
import { DiveSchedule } from '../../shared/dive.schedules';
import { ManagedDiveSchedules } from '../../shared/managedDiveSchedules';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { Streamed } from '../../shared/streamed';
import { MdbTabsModule } from 'mdb-angular-ui-kit/tabs';

import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-plan-tabs',
    templateUrl: './plan.tabs.component.html',
    styleUrls: ['./plan.tabs.component.scss'],
    imports: [MdbTabsModule, FaIconComponent, TranslatePipe]
})
export class PlanTabsComponent extends Streamed implements AfterViewInit {
    @ViewChild('tabs') public tabs: MdbTabsComponent | undefined;
    public addIcon = faPlus;
    public reloadIcon = faRotate;
    private activeTabIndex = 0;

    constructor(public schedules: ManagedDiveSchedules, private cd: ChangeDetectorRef, dispatcher: ReloadDispatcher) {
        super();

        // tab titles show depths edited in place by the depths components
        merge(dispatcher.depthChanged$, dispatcher.depthsReloaded$, dispatcher.setToSimple$)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => this.cd.markForCheck());
    }

    public ngAfterViewInit(): void {
        // hack to fix missing initial value of the selected tab
        const selectedIndex = this.schedules.selectedIndex;
        this.tabs?.setActiveTab(selectedIndex);
        this.activeTabIndex = selectedIndex;
        this.cd.detectChanges();

        this.tabs?.activeTabChange.pipe(takeUntil(this.unsubscribe$))
            .subscribe((e: MdbTabChange) => {
                this.selectedChanged(e);
            });
    }

    public closeTab(dive: DiveSchedule): void {
        this.schedules.remove(dive);
    }

    public tabClick(event: MouseEvent, dive: DiveSchedule): void {
        if (event.button === 1) {
            this.closeTab(dive);
        }
    }

    public addTab(): void {
        this.schedules.add();
    }

    private selectedChanged(e: MdbTabChange): void {
        let newIndex = e.index;
        if (e.index === this.schedules.length) {
            newIndex = e.index - 1;
            this.tabs?.setActiveTab(newIndex);
        }

        this.schedules.select(newIndex);
        this.activeTabIndex = newIndex;
    }
}
