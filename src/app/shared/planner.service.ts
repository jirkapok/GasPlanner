import { Injectable } from '@angular/core';
import { Plan, Diver, Gases, Dive } from './models';

@Injectable()
export class PlannerService {
  public plan: Plan = new Plan(20, 30, 1);
  public diver: Diver = new Diver(20);
  public gases: Gases = new Gases();
  public dive: Dive = new Dive();

  constructor() {
  }

  public calculate() {
    const averagePressure = this.averagePressure();
    const timeToSurface = this.calculateTimeToSurface();
    this.dive.timeToSurface = timeToSurface;
    const rockBottom = this.calculateRockBottom(timeToSurface, averagePressure);
    this.dive.rockBottom = rockBottom;
    this.dive.maxDepth = this.gases.current[0].mod;
    this.dive.maxTime = this.calculateMaxDiveTime(averagePressure, rockBottom);
  }

  private calculateMaxDiveTime(averagePressure: number, rockBottom: number): number {
    const totalVolume = this.gases.totalVolume();
    const availableGas = (totalVolume - rockBottom * this.gases.current[0].size) / this.plan.strategy;
    const result = availableGas / averagePressure / this.diver.sac;
    return Math.floor(result);
  }

  private calculateRockBottom(timeToSurface: number, averagePressure: number): number {
    const minimumRockBottom = 30;
    const firstGas = this.gases.current[0];
    const stressSac = 3 * this.diver.sac;
    const result = timeToSurface * stressSac * averagePressure / firstGas.size;
    const rounded = Math.ceil(result);
    return rounded > minimumRockBottom ? rounded : minimumRockBottom;
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
    this.gases.current[0].loadFrom(other.gases.current[0]);
  }
}
