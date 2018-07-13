import { Injectable } from '@angular/core';

export class Gas {
  constructor(public size: number, public startPressure: number) {
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
}

export class Dive {
  public maxDepth: number;
  public maxTime: number;
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
    this.dive.maxDepth = 300;
    this.dive.maxTime = 50;
  }
}
