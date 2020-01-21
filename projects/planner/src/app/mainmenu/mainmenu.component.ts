import { Component, OnInit } from '@angular/core';
import { PreferencesService } from '../shared/preferences.service';

@Component({
  selector: 'app-mainmenu',
  templateUrl: './mainmenu.component.html',
  styleUrls: ['./mainmenu.component.css']
})
export class MainMenuComponent implements OnInit {
  public isNavbarCollapsed = true;

  constructor(private preferences: PreferencesService) { }

  public saveDefaults(): void {
    this.preferences.saveDefaults();
  }

  public loadDefaults(): void {
    this.preferences.loadDefaults();
  }

  ngOnInit() {
  }
}
