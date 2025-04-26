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
import { FeatureFlags } from 'scuba-physics';

@Component({
    selector: 'app-mainmenu',
    templateUrl: './mainmenu.component.html',
    styleUrls: ['./mainmenu.component.scss']
})
export class MainMenuComponent {
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

    public gamification = FeatureFlags.Instance.gamification;

    constructor(
        private schedules: ManagedDiveSchedules,
        private share: ShareDiveService,
        public urls: Urls,) { }

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
}
