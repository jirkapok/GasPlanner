import { Component, OnInit } from '@angular/core';
import { PlannerService, Gases, Gas } from '../planner.service';

export enum StandardGas {
  Air = 21,
  EAN32 = 32,
  EAN36 = 36,
  EAN38 = 38,
  EAN50 = 50,
  OXYGEN = 100
}

@Component({
  selector: 'app-gases',
  templateUrl: './gases.component.html',
  styleUrls: ['./gases.component.css']
})
export class GasesComponent implements OnInit {
  public gases: Gases;
  public gasNames: string[];

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.gases = this.planer.gases;
    this.gasNames = Object.keys(StandardGas)
      .filter(k => typeof StandardGas[k] === 'number') as string[];
  }

  public assignStandardGas(gas: Gas, stgas: string): void {
    gas.o2 = StandardGas[stgas];
  }

  public add(): void {
    this.gases.add();
  }

  public remove(selected: Gas): void {
    this.gases.remove(selected);
  }
}
