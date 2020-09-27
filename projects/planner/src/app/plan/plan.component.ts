import { Component, OnInit, Input } from '@angular/core';
import { faClock } from '@fortawesome/free-regular-svg-icons';

import { Plan, Strategies, Diver } from '../shared/models';
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
  public readonly Low = 'Low (45/95)';
  public readonly Medium = 'Medium (40/85)';
  public readonly High = 'High (30/75)';
  public conservatism = this.Medium;
  public plan: Plan;
  public strategy = this.AllUsable;
  public clock = faClock;
  @Input() public formValid: boolean;

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
    return this.planer.isTechnical;
  }

  public set isTechnical(newValue: boolean) {
    this.planer.isTechnical = newValue;

    if (!this.planer.isTechnical) {
      this.allUsable();
      this.mediumConservatism();
      this.ascentSpeed = Diver.ascSpeed;
      this.descentSpeed = Diver.descSpeed;
    }
  }

  public lowConservatism() {
    this.conservatism = this.Low;
    this.plannedGfLow = 45;
    this.plannedGfHigh = 95;
  }

  public mediumConservatism() {
    this.conservatism = this.Medium;
    this.plannedGfLow = 40;
    this.plannedGfHigh = 85;
  }

  public highConservatism() {
    this.conservatism = this.High;
    this.plannedGfLow = 30;
    this.plannedGfHigh = 75;
  }

  public get plannedGfHigh(): number {
    return this.planer.options.gfHigh * 100;
  }

  public set plannedGfHigh(newValue: number) {
    this.planer.options.gfHigh = newValue / 100;
    this.planer.updateNoDecoTime();
  }

  public get plannedGfLow(): number {
    return this.planer.options.gfLow * 100;
  }

  public set plannedGfLow(newValue: number) {
    this.planer.options.gfLow = newValue / 100;
    this.planer.updateNoDecoTime();
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
    this.planer.updateNoDecoTime();
  }

  public get ascentSpeed(): number {
    return this.planer.options.ascentSpeed;
  }

  public set ascentSpeed(newValue: number) {
    this.planer.options.ascentSpeed = newValue;
    this.planer.updateNoDecoTime();
  }

  public get descentSpeed(): number {
    return this.planer.options.descentSpeed;
  }

  public set descentSpeed(newValue: number) {
    this.planer.options.descentSpeed = newValue;
    this.planer.updateNoDecoTime();
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
