import { Component, OnInit } from '@angular/core';
import { faBatteryEmpty, faTrashAlt, faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { Gases, Tank, Diver } from '../shared/models';

@Component({
  selector: 'app-gases',
  templateUrl: './gases.component.html',
  styleUrls: ['./gases.component.css']
})
export class GasesComponent implements OnInit {
  private diver: Diver;
  public firstGas: Tank;
  public gasNames: string[];
  public bottleIcon = faBatteryEmpty;
  public plusIcon = faPlusSquare;
  public trashIcon = faTrashAlt;
  constructor(private planner: PlannerService) { }

  ngOnInit() {
    this.firstGas = this.planner.firstGas;
    this.diver = this.planner.diver;
    this.gasNames = Gases.gasNames();
  }

  public get gases(): Tank[] {
    return this.planner.gases;
  }

  public get isTechnical(): boolean {
    return this.planner.isTechnical;
  }

  public get o2(): number {
    return this.firstGas.o2;
  }

  public set o2(newValue) {
    this.firstGas.o2 = newValue;
  }

  public gasSac(gas: Tank): number {
    return this.diver.gasSac(gas);
  }

  public addGas(): void {
    this.planner.addGas();
  }

  public removeGas(gas: Tank): void {
    this.planner.removeGas(gas);
  }

  public assignBestMix(): void {
    this.o2 = this.planner.bestNitroxMix();
  }

  public gasChanged(): void {
    this.planner.calculate();
  }

  public assignStandardGas(gas: Tank, gasName: string): void {
    gas.assignStandardGas(gasName);
    this.gasChanged();
  }
}
