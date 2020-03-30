import { Component, OnInit } from '@angular/core';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PreferencesService } from '../shared/preferences.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit  {
  public showDisclaimer = true;
  public exclamation = faExclamationTriangle;

  constructor(private preferences: PreferencesService) { }

  ngOnInit(): void {
    this.showDisclaimer = this.preferences.disclaimerEnabled();
  }

  public stopDisclaimer() {
    this.showDisclaimer = false;
    this.preferences.disableDisclaimer();
  }
}
