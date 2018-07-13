import { Component, OnInit } from '@angular/core';
import { PlannerService, Plan } from '../planner.service';
import { PreferencesService } from '../preferences.service';

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
