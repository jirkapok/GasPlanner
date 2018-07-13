import { Component, OnInit } from '@angular/core';
import { Plan } from '../shared/models';
import { PlannerService } from '../shared/planner.service';
import { PreferencesService } from '../shared/preferences.service';

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.css']
})
export class PlanComponent implements OnInit {
  public plan: Plan;

  constructor(private planer: PlannerService, private preferences: PreferencesService) { }

  ngOnInit() {
    this.plan = this.planer.plan;
    this.reset();
  }

  public calculate() {
    this.planer.calculate();
  }

  public saveDefaults() {
    this.preferences.saveDefaults();
  }

  public reset() {
    this.preferences.loadDefaults();
  }
}
