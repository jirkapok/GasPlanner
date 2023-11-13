import { Component, HostListener } from '@angular/core';
import { Urls } from '../shared/navigation.service';
import { PreferencesStore } from '../shared/preferencesStore';
import { faBars } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-mainmenu',
    templateUrl: './mainmenu.component.html',
    styleUrls: ['./mainmenu.component.scss']
})
export class MainMenuComponent {
    public isNavbarCollapsed = true;
    public faBars = faBars;
    public showInstallButton = false;
    private deferredPrompt: any;

    constructor(private preferences: PreferencesStore, public urls: Urls) { }

    @HostListener('window:beforeinstallprompt', ['$event'])
    public onbeforeinstallprompt(e: Event): void {
        e.preventDefault();
        this.deferredPrompt = e;
        this.showInstallButton = true;
    }

    public saveDefaults(): void {
        this.preferences.saveDefault();
    }

    public loadDefaults(): void {
        // TODO this.preferences.loadDefault();
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
