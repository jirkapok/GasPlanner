import { Component } from '@angular/core';
import { Urls } from '../shared/navigation.service';
import {
    faBars, faMountainSun, faHouse, faLungs, faTable,
    faWeightHanging, faPercent, faFileLines,
    faFaucet, faShareFromSquare, faTrashCan,
    faClone
} from '@fortawesome/free-solid-svg-icons';
import { ManagedDiveSchedules } from '../shared/managedDiveSchedules';
import { ShareDiveService } from '../shared/ShareDiveService';
import {
    ActivatedRoute,
    NavigationEnd,
    Router, RouterLink,
} from '@angular/router';
import { filter, map, takeUntil } from 'rxjs';
import { Streamed } from '../shared/streamed';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

import { MdbCollapseModule } from 'mdb-angular-ui-kit/collapse';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';

@Component({
    selector: 'app-mainmenu',
    templateUrl: './mainmenu.component.html',
    styleUrls: ['./mainmenu.component.scss'],
    imports: [
    RouterLink,
    FaIconComponent,
    MdbCollapseModule,
    MdbDropdownModule
]
})
export class MainMenuComponent extends Streamed {
    public isNavbarCollapsed = true;
    public iconMenu = faBars;
    public iconAltitude = faMountainSun;
    public iconRmv = faLungs;
    public iconPlanner = faHouse;
    public iconNdl = faTable;
    public iconWeight = faWeightHanging;
    public iconGasProperties = faFileLines;
    public iconNitrox = faPercent;
    public iconBlender = faFaucet;
    public iconShare = faShareFromSquare;
    public iconClone = faClone;
    public iconDelete = faTrashCan;
    public inPlanner = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private schedules: ManagedDiveSchedules,
        private share: ShareDiveService,
        public urls: Urls) {
        super();
        this.router.events.pipe(
            takeUntil(this.unsubscribe$),
            filter((event) => event instanceof NavigationEnd),
            map(() => this.rootRoute(this.route)),
            filter((r: ActivatedRoute) => r.outlet === 'primary'),
        ).subscribe((currentRoute: ActivatedRoute) => {
            this.inPlanner = currentRoute.snapshot.url.length === 0;
        });
    }

    public get canDeleteDive(): boolean {
        return !this.schedules.empty;
    }

    public saveDefaults(): void {
        this.schedules.saveDefaults();
    }

    public loadDefaults(): void {
        this.schedules.loadDefaults();
    }

    public cloneDive(): void {
        this.schedules.cloneSelected();
    }

    public shareDive(): void {
        this.share.sharePlan();
    }

    public deleteDive(): void {
        const dive = this.schedules.selected;
        this.schedules.remove(dive);
    }

    private rootRoute(route: ActivatedRoute): ActivatedRoute {
        while (route.firstChild) {
            route = route.firstChild;
        }
        return route;
    }
}
