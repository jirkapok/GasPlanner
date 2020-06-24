import { Component, OnInit, Input } from '@angular/core';
import { faClock } from '@fortawesome/free-regular-svg-icons';

import { Plan, Strategies } from '../shared/models';
import { PlannerService } from '../shared/planner.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  public plan: Plan;
  public clock = faClock;
  @Input() public formValid: boolean;

  constructor(private planer: PlannerService) { }

  ngOnInit(): void {
    this.plan = this.planer.plan;
    this.planer.updateNoDecoTime();
  }

  @Input()
  public get plannedDepth(): number {
    return this.plan.depth;
  }

  public set plannedDepth(depth: number) {
    this.plan.depth = depth;
    this.planer.updateNoDecoTime();
  }
}
