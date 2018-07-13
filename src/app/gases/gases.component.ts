import { Component, OnInit } from '@angular/core';
import { PlannerService, Gases, Gas } from '../planner.service';

@Component({
  selector: 'app-gases',
  templateUrl: './gases.component.html',
  styleUrls: ['./gases.component.css']
})
export class GasesComponent implements OnInit {
  private gases: Gases;

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.gases = this.planer.gases;
  }

  public add(): void {
    this.gases.add();
  }

  public remove(selected: Gas): void {
    this.gases.remove(selected);
  }
}
