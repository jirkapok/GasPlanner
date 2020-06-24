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
  private _isTechnical: boolean;

  constructor(private planer: PlannerService) { }

  ngOnInit(): void {
    this.plan = this.planer.plan;
    this.reset();
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

  public get isTechnical(): boolean {
    return this._isTechnical;
  }

  public set isTechnical(newValue: boolean) {
    this._isTechnical = newValue;

    if (!this._isTechnical) {
      this.allUsable();
    }
  }

  public get plannedGfHigh(): number {
    return this.planer.options.gfHigh * 100;
  }

  public set plannedGfHigh(newValue: number) {
    this.planer.options.gfHigh = newValue / 100;
  }

  public get plannedGfLow(): number {
    return this.planer.options.gfLow * 100;
  }

  public set plannedGfLow(newValue: number) {
    this.planer.options.gfLow = newValue / 100;
  }

  public get isFreshWater(): boolean {
    return this.planer.options.isFreshWater;
  }

  public set isFreshWater(newValue: boolean) {
    this.planer.changeWaterType(newValue);
  }

  public get plannedAltitude(): number {
    return this.planer.options.altitude;
  }

  public set plannedAltitude(newValue: number) {
    this.planer.options.altitude = newValue;
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
