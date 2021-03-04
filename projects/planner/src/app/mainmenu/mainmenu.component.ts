import { Component, HostListener } from '@angular/core';
import { PreferencesService } from '../shared/preferences.service';

@Component({
  selector: 'app-mainmenu',
  templateUrl: './mainmenu.component.html',
  styleUrls: ['./mainmenu.component.css']
})
export class MainMenuComponent {
  public isNavbarCollapsed = true;
  private deferredPrompt: any;
  public showInstallButton = false;

  constructor(private preferences: PreferencesService) { }

  public saveDefaults(): void {
    this.preferences.saveDefaults();
  }

  public loadDefaults(): void {
    this.preferences.loadDefaults();
  }

  @HostListener('window:beforeinstallprompt', ['$event'])
  public onbeforeinstallprompt(e: Event) {
    e.preventDefault();
    this.deferredPrompt = e;
    this.showInstallButton = true;
  }

  public addToHomeScreen(): void {
    this.showInstallButton = false;

    if(!!this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice
        .then((choiceResult: any) => {
          this.deferredPrompt = null;
        });
    }
  }
}
