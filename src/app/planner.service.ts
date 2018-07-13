import { Injectable } from '@angular/core';

export class Gas {
  constructor(public size: number, public startPressure: number, public o2: number) {
  }

  public volume(): number {
    return this.size * this.startPressure;
  }
}

export class Diver {
  constructor(public sac: number) {
  }
}

export class Plan {
  constructor(public duration: number, public depth: number) {
  }
}

export class Gases {
  public current: Gas[] = [this.createGas()];

  public add(): void {
    const newGas = this.createGas();
    this.current.push(newGas);
  }

  private createGas(): Gas {
    return new Gas(15, 200, 21);
  }

  public remove(selected: Gas): void {
    if (this.current.length <= 1) {
      return;
    }

    this.current.forEach( (item, index) => {
      if (item === selected) {
        this.current.splice(index, 1);
      }
    });
  }

  public totalVolume(): number {
    let total = 0;
    this.current.forEach(gas => {
      total += gas.volume();
    });
    return total;
  }
}

export class Dive {
  public maxDepth = 0;
  public maxTime = 0;
  public rockBottom = 0;
  public timeToSurface = 0;

  public canRealize(): boolean {
    return this.timeToSurface !== 0;
  }
}

@Injectable()
export class PlannerService {
  public plan: Plan = new Plan(10, 30);
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
    this.dive.maxDepth = this.calculateMaxDepth();
    this.dive.maxTime = this.calculateMaxDiveTime(averagePressure, rockBottom);
  }

  private calculateMaxDiveTime(averagePressure: number, rockBottom: number): number {
    const totalVolume = this.gases.totalVolume();
    const availableGas = totalVolume - rockBottom * this.gases.current[0].size;
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

  private calculateMaxDepth(): number {
    const maxPpO2 = 1.4;
    const ppO2 = this.gases.current[0].o2 / 100;
    const result = 10 * (maxPpO2 / ppO2 - 1);
    return Math.floor(result);
  }

  private depthToBar(depth: number): number {
    return 1 + depth / 10;
  }
}
