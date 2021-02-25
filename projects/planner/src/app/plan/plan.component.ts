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

  constructor(private planner: PlannerService) { }

  ngOnInit(): void {
    this.plan = this.planner.plan;
    this.reset();
  }

  @Input()
  public get plannedDepth(): number {
    return this.plan.depth;
  }

  public set plannedDepth(depth: number) {
    this.plan.depth = depth;
    this.planner.calculate();
  }

  public get isTechnical(): boolean {
    return this.planner.isTechnical;
  }

  public set isTechnical(newValue: boolean) {
    this.planner.isTechnical = newValue;

    if (!this.planner.isTechnical) {
      this.setAllUsable();
      this.mediumConservatism();
      this.setAscentSpeed(Diver.ascSpeed);
      this.setDescentSpeed(Diver.descSpeed);
      this.setRoundDecoStops(true);
      this.setSafetyStopEnabled(true);
      this.setGasSwitchDuration(1);
      this.planner.resetToDefaultGases();
    }

    this.planner.calculate();
  }

  public get roundDecoStops(): boolean {
    return this.planner.options.roundStopsToMinutes;
  }

  private setRoundDecoStops(newValue: boolean): void {
    this.planner.options.roundStopsToMinutes = newValue;
  }

  public set roundDecoStops(newValue: boolean) {
    this.setRoundDecoStops(newValue);
    this.planner.calculate();
  }

  public get gasSwitchDuration(): number {
    return this.planner.options.gasSwitchDuration;
  }

  private setGasSwitchDuration(newValue: number): void {
    this.planner.options.gasSwitchDuration = newValue;
  }

  public set gasSwitchDuration(newValue: number) {
    this.setGasSwitchDuration(newValue);
    this.planner.calculate();
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
    return this.planner.options.gfHigh * 100;
  }

  public set plannedGfHigh(newValue: number) {
    this.planner.options.gfHigh = newValue / 100;
    this.planner.calculate();
  }

  public get plannedGfLow(): number {
    return this.planner.options.gfLow * 100;
  }

  public set plannedGfLow(newValue: number) {
    this.planner.options.gfLow = newValue / 100;
    this.planner.calculate();
  }

  public get isFreshWater(): boolean {
    return this.planner.options.isFreshWater;
  }

  public set isFreshWater(newValue: boolean) {
    this.planner.changeWaterType(newValue);
  }

  public get safetyStopEnabled(): boolean {
    return this.planner.options.addSafetyStop;
  }

  private setSafetyStopEnabled(newValue: boolean): void {
    this.planner.options.addSafetyStop = newValue;
  }

  public set safetyStopEnabled(newValue: boolean) {
    this.setSafetyStopEnabled(newValue);
    this.planner.calculate();
  }

  public get plannedAltitude(): number {
    return this.planner.options.altitude;
  }

  public set plannedAltitude(newValue: number) {
    this.planner.options.altitude = newValue;
    this.planner.calculate();
  }

  public get ascentSpeed(): number {
    return this.planner.options.ascentSpeed;
  }

  private setAscentSpeed(newValue: number) {
    this.planner.options.ascentSpeed = newValue;
  }

  public set ascentSpeed(newValue: number) {
    this.setAscentSpeed(newValue);
    this.planner.calculate();
  }

  public get descentSpeed(): number {
    return this.planner.options.descentSpeed;
  }

  private setDescentSpeed(newValue: number) {
    this.planner.options.descentSpeed = newValue;
  }

  public set descentSpeed(newValue: number) {
    this.setDescentSpeed(newValue);
    this.planner.calculate();
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
    this.setAllUsable();
    this.planner.calculate();
  }

  private setAllUsable(): void {
    this.plan.strategy = Strategies.ALL;
    this.strategy = this.AllUsable;
  }

  public halfUsable(): void {
    this.plan.strategy = Strategies.HALF;
    this.strategy = this.HalfUsable;
    this.planner.calculate();
  }

  public thirdUsable(): void {
    this.plan.strategy = Strategies.THIRD;
    this.strategy = this.ThirdUsable;
    this.planner.calculate();
  }
}
