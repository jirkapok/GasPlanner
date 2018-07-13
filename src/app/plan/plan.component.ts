import { Component, OnInit } from '@angular/core';
import { PlannerService, Plan } from '../planner.service';

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.css']
})
export class PlanComponent implements OnInit {
  public plan: Plan;

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.plan = this.planer.plan;
  }

  public calculate() {
    this.planer.calculate();
  }
}
