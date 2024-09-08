import { Component, HostListener } from '@angular/core';
import { Urls } from '../shared/navigation.service';
import {
    faBars, faMountainSun, faHouse, faLungs, faTable,
    faWeightHanging, faPercent, faFileLines,
    faFaucet
} from '@fortawesome/free-solid-svg-icons';
import { ManagedDiveSchedules } from '../shared/managedDiveSchedules';

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

    public showInstallButton = false;
    private deferredPrompt: any;

    constructor(private schedules: ManagedDiveSchedules, public urls: Urls) { }

    @HostListener('window:beforeinstallprompt', ['$event'])
    public onbeforeinstallprompt(e: Event): void {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallButton = true;
    }

    public saveDefaults(): void {
        this.schedules.saveDefaults();
    }

    public loadDefaults(): void {
        this.schedules.loadDefaults();
    }

    public addToHomeScreen(): void {
        this.showInstallButton = false;

        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice
                .then((choiceResult: any) => {
                    this.deferredPrompt = null;
                });
        }
    }
}
