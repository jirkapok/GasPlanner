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
    const maxX = this.dive.wayPoints[this.dive.wayPoints.length - 1].x2;
    return x * graphWidth / maxX;
  }

  public scaleHeight(y: number, graphHeight: number): number {
    // for single level dives second is always depth
    const maxY = this.dive.wayPoints[1].y1;
    return y * graphHeight / maxY;
  }

  public get graphHeight(): number {
    // for single level dives second is always depth
    return this.dive.wayPoints[1].y1;
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

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.dive = this.planer.dive;
    this.bottomGas = this.planer.gas;
  }
}
