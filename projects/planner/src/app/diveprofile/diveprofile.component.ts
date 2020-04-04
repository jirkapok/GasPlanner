import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive } from '../shared/models';
import { faTasks } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js-dist';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-diveprofile',
  templateUrl: './diveprofile.component.html',
  styleUrls: ['./diveprofile.component.css']
})
export class DiveProfileComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
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

  constructor(private planer: PlannerService) {
    this.subscription = this.planer.calculated.subscribe(() => {
        this.plotChart();
    });
   }

   ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private plotChart() {
    const layout = {
      autosize: true,
      showlegend: false,
      xaxis : {
        fixedrange: true
      },
      yaxis: {
        fixedrange: true,
        autorange: 'reversed'
      },
      margin: { l: 30, r: 30, b: 30, t: 10 },
    };

    const options = {
      displaylogo: false,
      displayModeBar: false,
      responsive: true,
      // staticPlot: true,
      autosize: true,
      scrollZoom: false,
      editable: false
    };

    const xValues = [];
    const yValues = [];

    const data = [{
      x: xValues,
      y: yValues,
      type: 'scatter',
      name: 'dive'
    }];

    this.dive.wayPoints.forEach((item, index, waypoints) => {
        xValues.push(item.startTime);
        yValues.push(item.startDepth);
        xValues.push(item.endTime);
        yValues.push(item.endDepth);
      });

    Plotly.react('diveplot', data, layout, options);

    const xCelingValues = [];
    const yCelingValues = [];

    this.dive.ceilings.forEach((item, index, ceilings) => {
      xCelingValues.push(item.time);
      yCelingValues.push(item.depth);
    });

    const dataCeilings = [{
      x: xCelingValues,
      y: yCelingValues,
      type: 'scatter',
      name: 'ceilings'
    }];

    Plotly.plot('diveplot', dataCeilings, layout, options);
  }

  ngOnInit() {
    this.dive = this.planer.dive;
    this.plotChart();
  }
}
