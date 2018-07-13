import { Component, OnInit } from '@angular/core';
import { Plan, Strategies } from '../shared/models';
import { PlannerService } from '../shared/planner.service';
import { PreferencesService } from '../shared/preferences.service';

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.css']
})
export class PlanComponent implements OnInit {
  public readonly AllUsable = 'All usable';
  public readonly HalfUsable = 'Half usable';
  public readonly ThirdUsable = 'Thirds usable';
  public plan: Plan;
  public strategy = this.AllUsable;

  constructor(private planer: PlannerService, private preferences: PreferencesService) { }

  ngOnInit(): void {
    this.plan = this.planer.plan;
    this.reset();
  }

  public calculate(): void {
    this.planer.calculate();
  }

  public saveDefaults(): void {
    this.preferences.saveDefaults();
  }

  public reset(): void {
    this.preferences.loadDefaults();
  }

  public allUsable(): void {
    this.plan.strategy = Strategies.ALL;
    this.strategy = this.AllUsable;
  }

  public halfUsable(): void {
    this.plan.strategy = Strategies.HALF;
    this.strategy = this.HalfUsable;
  }

  public thirdUsable(): void {
    this.plan.strategy = Strategies.THIRD;
    this.strategy = this.ThirdUsable;
  }
}
