import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, Gas } from '../shared/models';
import { faTasks } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-diveprofile',
  templateUrl: './diveprofile.component.html',
  styleUrls: ['./diveprofile.component.css']
})
export class DiveProfileComponent implements OnInit {
  public dive: Dive;
  public tasks = faTasks;

  public scaleWidth(x: number, graphWidth: number): number {
    return x * graphWidth / this.dive.totalDuration;
  }

  public scaleHeight(y: number, graphHeight: number): number {
    return y * (graphHeight - 10) / this.dive.maxDepth;
  }

  public get noDecoTime(): number {
    return this.planer.plan.noDecoTime;
  }

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.dive = this.planer.dive;
  }
}
