import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { PreferencesStore } from './preferencesStore';
import { PlanUrlSerialization } from './PlanUrlSerialization';
import { SubViewStorage } from './subViewStorage';
import { ViewStates } from './viewStates';

@Injectable()
export class DashboardStartUp {
    private _showDisclaimer = true;
    private _showInstallButton = false;
    private allowInstall = false;
    private deferredPrompt: any;

    constructor(
        private location: Location,
        private preferences: PreferencesStore,
        private urlSerialization: PlanUrlSerialization,
        private viewStore: SubViewStorage,
        private views: ViewStates) {
        this._showDisclaimer = this.preferences.disclaimerEnabled();
        this._showInstallButton = this.preferences.installEnabled();
    }

    public get showDisclaimer(): boolean {
        return this._showDisclaimer;
    }

    public get showInstallButton(): boolean {
        return this.allowInstall && this._showInstallButton;
    }

    public get showAppleInstall(): boolean {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOs = /iphone|ipad|ipod/.test(userAgent);
        const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);
        return isIOs && !isInStandaloneMode;
    }

    public onDashboard(): void {
        const query = window.location.search;

        if (query === '' || this.views.started) {
            // no need to restore the state, since dives are kept in service states
            // no calculation needed because it was already done in reload
        } else {
            // the only view which loads from parameters instead of view state
            this.urlSerialization.fromUrl(query);
        }

        // cant do in constructor, since the state may be changed
        this.viewStore.saveMainView();
        // in case it fails we need to reset the parameters
        // or in case of navigation to dashboard with only one dive
        this.updateQueryParams();
    }

    public stopDisclaimer(): void {
        this._showDisclaimer = false;
        this.preferences.disableDisclaimer();
    }

    public stopShowInstallButton(): void {
        this._showInstallButton = false;
        this.preferences.disableShowInstall();
    }

    public updateQueryParams(): void {
        let urlParams = this.urlSerialization.toUrl();
        const maxUrlRecommendedLength = 2048;

        if (urlParams.length > maxUrlRecommendedLength) {
            console.warn('Created url parameters with length longer than acceptable in some browsers');
        }

        if(urlParams.length > 0) {
            urlParams = '?' + urlParams;
        }

        this.location.go(urlParams);
    }

    public onbeforeinstallprompt(e: Event): void {
        e.preventDefault();
        this.deferredPrompt = e;
        this.allowInstall = true;
    }

    public addToHomeScreen(): void {
        this.allowInstall = false;
        this.stopShowInstallButton();

        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice
                .then((choiceResult: any) => {
                    this.deferredPrompt = null;
                });
        }
    }
}
