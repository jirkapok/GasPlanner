import { Injectable } from '@angular/core';

export class Gas {
  constructor(public size: number, public startPressure: number) {
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
    return new Gas(15, 200);
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
  public maxDepth: number;
  public maxTime: number;
  public rockBottom: number;
  public timeToSurface: number;
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
    return availableGas / averagePressure / this.diver.sac;
  }

  private calculateRockBottom(timeToSurface: number, averagePressure: number): number {
    const firstGas = this.gases.current[0];
    const stressSac = 3 * this.diver.sac;
    return timeToSurface * stressSac * averagePressure / firstGas.size;
  }

  private averagePressure(): number {
    const averageDepth = this.plan.depth / 2;
    return 1 + averageDepth / 10;
  }

  private calculateTimeToSurface(): number {
    const solutionDuration = 2;
    const swimSpeed = 10; // meter/min.
    const safetyStop = this.dive.maxDepth >= 5 ? 3 : 0;
    const swimTime = Math.ceil(this.dive.maxDepth / swimSpeed);
    return solutionDuration + swimTime + safetyStop;
  }

  private calculateMaxDepth(): number {
    return 30;
  }
}
