import { Component, OnInit, Input } from '@angular/core';
import { faClock } from '@fortawesome/free-regular-svg-icons';

import { Plan, Strategies } from '../shared/models';
import { PlannerService } from '../shared/planner.service';

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
  public clock = faClock;
  @Input() public formValid: boolean;

  constructor(private planer: PlannerService) { }

  ngOnInit(): void {
    this.plan = this.planer.plan;
    this.reset();
  }

  public calculate(): void {
    this.planer.calculate();
  }

  public reset(): void {
    switch (this.plan.strategy) {
      case Strategies.HALF: {
        this.halfUsable();
        break;
      }
      case Strategies.THIRD: {
        this.thirdUsable();
        break;
      }
      default: {
        this.allUsable();
        break;
      }
    }
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
