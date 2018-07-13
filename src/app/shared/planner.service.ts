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
    const availableGas = this.availableGas(rockBottom);

    this.dive.timeToSurface = timeToSurface;
    this.dive.rockBottom = rockBottom;
    this.dive.maxDepth = this.firstGas.mod;
    this.dive.maxTime = this.calculateMaxDiveTime(averagePressure, availableGas);

    this.dive.consumed = this.calculateConsumed(this.plan.duration, this.diver.sac, averagePressure, this.firstGas.size);
    this.firstGas.consume(this.dive.consumed);
  }

  private calculateMaxDiveTime(averagePressure: number, availableGas: number): number {
    const result = availableGas / averagePressure / this.diver.sac;
    return Math.floor(result);
  }

  private availableGas(rockBottom: number): number {
    const totalVolume = this.gases.totalVolume();
    const usablePart = this.plan.strategy === Strategies.THIRD ? 2 / 3 : 1;
    return (totalVolume - rockBottom * this.firstGas.size) * usablePart;
  }

  private calculateRockBottom(timeToSurface: number, averagePressure: number): number {
    const minimumRockBottom = 30;
    const stressSac = this.diver.stressSac;
    const result = this.calculateConsumed(timeToSurface, stressSac, averagePressure, this.firstGas.size);
    return result > minimumRockBottom ? result : minimumRockBottom;
  }

  private calculateConsumed(time: number, sac: number, averagePressure: number, gasSize): number {
    const result = time * averagePressure * this.gasSac(sac, gasSize);
    const rounded = Math.ceil(result);
    return rounded;
  }

  public normalGasSac(gas: Gas): number {
    return this.gasSac(this.diver.sac, gas.size);
  }

  private gasSac(sac: number, gasSize: number): number {
    return sac / gasSize;
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
    this.firstGas.loadFrom(other.gases.current[0]);
  }
}
