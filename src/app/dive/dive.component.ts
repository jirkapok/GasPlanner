import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, Gas } from '../shared/models';
import { faExclamationCircle, faTasks } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-dive',
  templateUrl: './dive.component.html',
  styleUrls: ['./dive.component.css']
})
export class DiveComponent implements OnInit {
  public dive: Dive;
  public bottomGas: Gas;
  public exclamation = faExclamationCircle;
  public tasks = faTasks;

  public scaleWidth(x: number, graphWidth: number): number {
    return x * graphWidth / this.dive.totalDuration;
  }

  public scaleHeight(y: number, graphHeight: number): number {
    return y * (graphHeight - 10) / this.dive.maxDepth;
  }

  public get bottomGasMax() {
    return this.bottomGas.startPressure;
  }

  public get bottomGasRockBottom() {
    return this.dive.rockBottom;
  }

  public get bottomGasRemaining() {
    return this.bottomGas.endPressure - this.bottomGasRockBottom;
  }

  public get percentsRockBottom() {
    return this.dive.rockBottom / this.bottomGas.startPressure * 100;
  }

  public get bottomGasPercentsRemaining() {
    return this.bottomGasRemaining / this.bottomGas.startPressure * 100;
  }

  public get needsReturn(): boolean {
    return this.planer.plan.needsReturn;
  }

  public get gasMod(): number {
    return this.planer.gasMod;
  }

  public get noDecoTime(): number {
    return this.planer.plan.noDecoTime;
  }

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.dive = this.planer.dive;
    this.bottomGas = this.planer.gas;
  }
}
