import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, Gas } from '../shared/models';

@Component({
  selector: 'app-dive',
  templateUrl: './dive.component.html',
  styleUrls: ['./dive.component.css']
})
export class DiveComponent implements OnInit {
  public dive: Dive;
  public bottomGas: Gas;
  public get bottomGasMax() {
    return this.bottomGas.startPressure;
  }

  public get bottomGasRockBottom() {
    return this.dive.rockBottom;
  }

  public get bottomGasRemaining() {
    return this.bottomGas.endPressure;
  }

  public get percentsRockBottom() {
    return this.dive.rockBottom / this.bottomGas.startPressure * 100;
  }

  public get bottomGasPercentsRemaining() {
    return (this.bottomGasRemaining - this.bottomGasRockBottom) / this.bottomGas.startPressure * 100;
  }

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.dive = this.planer.dive;
    this.bottomGas = this.planer.gases.current[0];
  }
}
