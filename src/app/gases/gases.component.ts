import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Gases, Gas } from '../shared/models';

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
    this.gasNames = Gases.gasNames();
  }

  public add(): void {
    this.gases.add();
  }

  public remove(selected: Gas): void {
    this.gases.remove(selected);
  }

  public gasSac(gas: Gas): number {
    return this.planer.normalGasSac(gas);
  }
}
