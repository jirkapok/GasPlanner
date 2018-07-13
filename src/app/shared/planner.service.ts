import { Injectable } from '@angular/core';
import { Plan, Diver, Gases, Dive, Strategies, Gas } from './models';

@Injectable()
export class PlannerService {
  public plan: Plan = new Plan(20, 30, 1);
  public diver: Diver = new Diver(20);
  public gases: Gases = new Gases();
  public dive: Dive = new Dive();

  constructor() {
  }

  public get firstGas(): Gas {
    return this.gases.current[0];
  }

  public calculate() {
    const averagePressure = this.averagePressure();
    const timeToSurface = this.calculateTimeToSurface();
    const rockBottom = this.calculateRockBottom(timeToSurface, averagePressure);
    const availableVolume = this.availableVolume(rockBottom);

    this.dive.timeToSurface = timeToSurface;
    this.dive.rockBottom = rockBottom;
    this.dive.maxDepth = this.firstGas.mod;
    this.dive.maxTime = this.calculateMaxDiveTime(averagePressure, availableVolume);
    this.firstGas.consumed = this.calculateConsumed(this.plan.duration,
      this.diver.sac, averagePressure, this.firstGas.size);

    // TODO before turn, we should subtract surfacing
    this.dive.turnPressure = this.calculateTurnPressure();
    this.dive.turnTime = Math.floor(this.plan.duration / 2);
    this.dive.needsReturn = this.plan.needsReturn;
    this.dive.calculated = true;
  }

  private calculateTurnPressure(): number {
    const consumed = this.firstGas.consumed / 2;
    return this.firstGas.startPressure - Math.floor(consumed);
  }

  private calculateMaxDiveTime(averagePressure: number, availableVolume: number): number {
    const result = availableVolume / averagePressure / this.diver.sac;
    return Math.floor(result);
  }

  private availableVolume(rockBottom: number): number {
    const totalVolume = this.firstGas.volume;
    const usablePart = this.plan.availablePressureRatio;
    return (totalVolume - rockBottom * this.firstGas.size) * usablePart;
  }

  private calculateRockBottom(timeToSurface: number, averagePressure: number): number {
    const minimumRockBottom = 30;
    const stressSac = this.diver.stressSac;
    const result = this.calculateConsumed(timeToSurface, stressSac, averagePressure, this.firstGas.size);
    return result > minimumRockBottom ? result : minimumRockBottom;
  }

  private calculateConsumed(time: number, sac: number, averagePressure: number, gasSize): number {
    const result = time * averagePressure * Diver.gasSac(sac, gasSize);
    const rounded = Math.ceil(result);
    return rounded;
  }

  private averagePressure(): number {
    const averageDepth = this.plan.depth / 2;
    return this.depthToBar(averageDepth);
  }

  private calculateTimeToSurface(): number {
    const solutionDuration = 2;
    const swimSpeed = 10; // meter/min.
    const safetyStop = this.plan.depth >= 20 ? 3 : 0;
    const swimTime = Math.ceil(this.plan.depth / swimSpeed);
    return solutionDuration + swimTime + safetyStop;
  }

  private depthToBar(depth: number): number {
    return 1 + depth / 10;
  }

  public loadFrom(other: PlannerService): void {
    if (!other) {
      return;
    }

    this.plan.loadFrom(other.plan);
    this.diver.loadFrom(other.diver);
    // cant use firstGas from the other, since it doesn't have to be deserialized
    this.firstGas.loadFrom(other.gases.current[0]);
  }
}
